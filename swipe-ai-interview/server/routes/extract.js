const DEFAULT_TIMEOUT_MS = 45_000;

async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

const { FormData: GlobalFormData, Blob: GlobalBlob } = globalThis;

function createFormData() {
  if (typeof GlobalFormData === 'function') {
    return new GlobalFormData();
  }
  throw new Error('FormData is not available in this runtime. Node 18+ is required.');
}

export function registerExtractRoutes(app) {
  app.get('/api/extract', (_req, res) => {
    res.json({ ok: true, use: 'POST /api/extract with { fileBase64, mime, fileName }' });
  });

  app.post('/api/extract', async (req, res) => {
    const apiKey = process.env.OPENAI_API_KEY;
    const body = req.body ?? {};

    let fileBase64 = typeof body?.fileBase64 === 'string' ? body.fileBase64 : null;
    const mime = typeof body?.mime === 'string' ? body.mime : 'application/pdf';
    const fileName = typeof body?.fileName === 'string' ? body.fileName : 'resume.pdf';
    const model = process.env.OPENAI_MODEL || 'gpt-4o';

    if (!fileBase64) {
      res.json({ name: null, email: null, phone: null });
      return;
    }
    if (fileBase64.includes(',')) fileBase64 = fileBase64.split(',').pop() || null;

    const fileBuffer = fileBase64 ? Buffer.from(fileBase64, 'base64') : null;
    if (!fileBuffer || fileBuffer.length < 100) {
      res.json({ name: null, email: null, phone: null });
      return;
    }

    if (!apiKey) {
      res.json({ name: null, email: null, phone: null, warning: 'OPENAI_API_KEY not set' });
      return;
    }

    if (!GlobalFormData || !GlobalBlob) {
      res.status(500).json({ error: 'FormData/Blob not available in this runtime. Use Node 18+.' });
      return;
    }

    let uploadedFile;
    try {
      const fd = createFormData();
      fd.append('file', new GlobalBlob([fileBuffer], { type: mime }), fileName);
      fd.append('purpose', 'assistants');
      const fileRes = await fetchWithTimeout('https://api.openai.com/v1/files', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: fd,
      });
      if (!fileRes.ok) throw new Error(await fileRes.text());
      uploadedFile = await fileRes.json();
    } catch (err) {
      res.status(500).json({ error: `File upload failed: ${err?.message || err}` });
      return;
    }

    const existingAssistantId = process.env.OPENAI_ASSISTANT_ID;
    let assistantId = existingAssistantId ?? null;
    let createdAssistant = false;

    const jsonSchema = {
      name: 'CandidateDetails',
      schema: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'email', 'phone'],
        properties: {
          name: { anyOf: [{ type: 'string', minLength: 2, maxLength: 120 }, { type: 'null' }] },
          email: { anyOf: [{ type: 'string', minLength: 5, maxLength: 200 }, { type: 'null' }] },
          phone: { anyOf: [{ type: 'string', minLength: 7, maxLength: 40 }, { type: 'null' }] },
        },
      },
      strict: true,
    };

    const instructions =
      'Read the attached resume and return ONLY JSON with keys { name, email, phone }.\n' +
      "- name: legal full name of the person (NOT 'My Resume', NOT a company).\n" +
      '- email: main contact email.\n' +
      '- phone: ONE best contact number. Prefer numbers near labels Phone/Mobile/Contact/Tel/Cell/WhatsApp. Ignore timestamps/IDs.\n' +
      '- If a field is missing, use null.\n' +
      'Return strictly valid JSON that matches the schema. No extra text.';

    try {
      if (!assistantId) {
        const assistantRes = await fetchWithTimeout('https://api.openai.com/v1/assistants', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'assistants=v2',
          },
          body: JSON.stringify({
            model,
            instructions,
            tools: [{ type: 'file_search' }],
            response_format: { type: 'json_schema', json_schema: jsonSchema },
          }),
        });
        if (!assistantRes.ok) throw new Error(await assistantRes.text());
        const assistant = await assistantRes.json();
        assistantId = assistant.id;
        createdAssistant = true;
      }
    } catch (err) {
      res.status(500).json({ error: `Assistant creation failed: ${err?.message || err}` });
      return;
    }

    let run;
    try {
      const runRes = await fetchWithTimeout('https://api.openai.com/v1/threads/runs', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2',
        },
        body: JSON.stringify({
          assistant_id: assistantId,
          thread: {
            messages: [
              {
                role: 'user',
                content: 'Extract {name, email, phone} from the attached resume.',
                attachments: [{ file_id: uploadedFile.id, tools: [{ type: 'file_search' }] }],
              },
            ],
          },
          response_format: { type: 'json_schema', json_schema: jsonSchema },
        }),
      });
      if (!runRes.ok) throw new Error(await runRes.text());
      run = await runRes.json();
    } catch (err) {
      res.status(500).json({ error: `Run creation failed: ${err?.message || err}` });
      return;
    }

    const start = Date.now();
    try {
      while (['queued', 'in_progress', 'cancelling'].includes(run.status)) {
        if (Date.now() - start > MAX_POLL_MS) {
          res.status(504).json({ error: 'Timed out waiting for assistant run.' });
          return;
        }
        await sleep(1000);
        const check = await fetchWithTimeout(`https://api.openai.com/v1/threads/${run.thread_id}/runs/${run.id}`, {
          headers: { Authorization: `Bearer ${apiKey}`, 'OpenAI-Beta': 'assistants=v2' },
        });
        run = await check.json();
      }
    } catch (err) {
      res.status(500).json({ error: `Run polling failed: ${err?.message || err}` });
      return;
    }

    if (run.status !== 'completed') {
      await safeDeleteFile(apiKey, uploadedFile?.id);
      if (createdAssistant && assistantId) await safeDeleteAssistant(apiKey, assistantId);
      await safeDeleteThread(apiKey, run.thread_id);
      res.status(500).json({ error: `Run ended with status: ${run.status}` });
      return;
    }

    let parsed = null;
    try {
      const messagesRes = await fetchWithTimeout(`https://api.openai.com/v1/threads/${run.thread_id}/messages?limit=10`, {
        headers: { Authorization: `Bearer ${apiKey}`, 'OpenAI-Beta': 'assistants=v2' },
      });
      const messagesData = await messagesRes.json();
      const assistantMsg = (messagesData?.data || []).find((m) => m.role === 'assistant');
      if (assistantMsg) {
        const parts = Array.isArray(assistantMsg.content) ? assistantMsg.content : [];
        const texts = [];
        for (const part of parts) {
          if (part?.text?.value) texts.push(part.text.value);
          if (part?.output_text?.content?.[0]?.text) texts.push(part.output_text.content[0].text);
          if (typeof part === 'string') texts.push(part);
        }
        const cleaned = texts.join('\n').replace(/```json/gi, '').replace(/```/g, '').trim();
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        const toParse = jsonMatch ? jsonMatch[0] : cleaned;
        try {
          parsed = JSON.parse(toParse);
        } catch {
          parsed = null;
        }
      }
    } catch {
      parsed = null;
    }

    await safeDeleteFile(apiKey, uploadedFile?.id);
    if (createdAssistant && assistantId) await safeDeleteAssistant(apiKey, assistantId);
    await safeDeleteThread(apiKey, run.thread_id);

    if (!parsed) {
      res.json({ name: null, email: null, phone: null });
      return;
    }

    const result = {
      name: cleanName(parsed?.name),
      email: cleanEmail(parsed?.email),
      phone: normalizePhone(parsed?.phone),
    };

    res.json(result);
  });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const MAX_POLL_MS = 60_000;

async function safeDeleteFile(apiKey, fileId) {
  if (!fileId) return;
  try {
    await fetch(`https://api.openai.com/v1/files/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${apiKey}` },
    });
  } catch {}
}

async function safeDeleteAssistant(apiKey, assistantId) {
  try {
    await fetch(`https://api.openai.com/v1/assistants/${assistantId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${apiKey}`, 'OpenAI-Beta': 'assistants=v2' },
    });
  } catch {}
}

async function safeDeleteThread(apiKey, threadId) {
  try {
    await fetch(`https://api.openai.com/v1/threads/${threadId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${apiKey}`, 'OpenAI-Beta': 'assistants=v2' },
    });
  } catch {}
}

function cleanName(value) {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (!trimmed) return null;
  if (/^my\s+resume$/i.test(trimmed) || /\bresume|curriculum|vitae\b/i.test(trimmed)) return null;
  return trimmed.length > 120 ? trimmed.slice(0, 120) : trimmed;
}

function cleanEmail(value) {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(trimmed) ? trimmed : null;
}

function normalizePhone(value) {
  if (!value || typeof value !== 'string') return null;
  let s = value.trim().replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
  const digits = s.replace(/\D/g, '');
  if (!digits || digits.length < 7) return null;
  if (s.startsWith('+') && digits.length >= 10 && digits.length <= 15) return s;
  if (!s.startsWith('+') && /^[6-9]\d{9}$/.test(digits)) return `+91${digits}`;
  if (!s.startsWith('+') && digits.length >= 10 && digits.length <= 15) return `+${digits}`;
  return null;
}
