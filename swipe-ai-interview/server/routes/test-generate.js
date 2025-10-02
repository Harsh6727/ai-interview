function buildSchema() {
  return {
    name: 'InterviewQuestion',
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        id: { type: 'string', description: 'stable id; set to the provided nonce' },
        difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
        type: { type: 'string', enum: ['mcq'] },
        prompt: { type: 'string' },
        language: { type: 'null' },
        starter_code: { type: 'null' },
        options: {
          type: 'array',
          minItems: 4,
          maxItems: 4,
          items: { type: 'string' },
        },
        correct_option: { type: 'integer', minimum: 0, maximum: 3 },
        expected_output: { type: 'null' },
        rubric: { anyOf: [{ type: 'string' }, { type: 'null' }] },
        time_limit_seconds: { type: 'integer' },
      },
      required: [
        'id',
        'difficulty',
        'type',
        'prompt',
        'language',
        'starter_code',
        'options',
        'correct_option',
        'expected_output',
        'rubric',
        'time_limit_seconds',
      ],
    },
    strict: true,
  };
}

function buildRules({ role, nonce, seenTopics, timeLimitSec }) {
  return [
    `Create ONE unique multiple-choice interview question for a ${role} candidate.`,
    'Return STRICT JSON per schema (no markdown).',
    `Set "id" equal to this NONCE exactly: ${nonce}`,
    `This question must be UNIQUE. Do NOT reuse topics/examples similar to this list: ${
      seenTopics.map((topic, idx) => `[${idx + 1}] ${topic}`).join(' | ') || '(none)'
    }.`,
    'Vary subtopics, domain, or scenario details to ensure novelty even across multiple sessions.',
    `time_limit_seconds = ${timeLimitSec}.`,
    'Type is "mcq". Include exactly 4 options (A-D style text) and one correct_option (0..3).',
    'Avoid "All of the above"/"None of the above". Keep prompt concise and practical.',
    'language=null, starter_code=null, expected_output=null.',
  ];
}

function padOptions(options) {
  const list = (options || []).map((value) => String(value ?? '')).filter(Boolean).slice(0, 4);
  while (list.length < 4) {
    list.push(`Option ${list.length + 1}`);
  }
  return list;
}

export function registerTestGenerateRoutes(app) {
  app.post('/api/test/generate', async (req, res) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'OPENAI_API_KEY not set' });
      return;
    }

    const body = req.body ?? {};
    const spec = body.spec ?? {};
    if (!spec.difficulty || !spec.type || !spec.timeLimitSec) {
      res.status(400).json({ error: 'spec is required' });
      return;
    }

    const role = spec.role || 'full-stack (React/Node)';
    const nonce = String(spec.nonce || `${Date.now()}-${Math.random()}`);
    const seenTopics = (Array.isArray(spec.history) ? spec.history : [])
      .filter((value) => typeof value === 'string')
      .slice(-8);

    const schema = buildSchema();
    const rules = buildRules({ role, nonce, seenTopics, timeLimitSec: spec.timeLimitSec });

    const payload = {
      model: process.env.OPENAI_MODEL || 'gpt-4.1',
      temperature: 0.7,
      response_format: { type: 'json_schema', json_schema: schema },
      messages: [
        {
          role: 'system',
          content: 'You generate interview questions as strict JSON only. Always include all fields (use null where not applicable).',
        },
        { role: 'user', content: rules.join('\n') },
      ],
    };

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.text().catch(() => '');
        res.status(500).json({ error: 'generate failed', details: err });
        return;
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content ?? '{}';
      let question;
      try {
        question = JSON.parse(content);
      } catch {
        question = null;
      }

      if (!question) {
        res.status(500).json({ error: 'invalid JSON from model' });
        return;
      }

      question.id = nonce;
      question.type = 'mcq';
      question.difficulty = spec.difficulty;
      question.time_limit_seconds = spec.timeLimitSec;
      question.language = null;
      question.starter_code = null;
      question.expected_output = null;
      question.options = padOptions(question.options);

      let idx = typeof question.correct_option === 'number' && Number.isInteger(question.correct_option)
        ? question.correct_option
        : 0;
      if (idx < 0 || idx > 3) idx = 0;
      question.correct_option = idx;

      if (typeof question.prompt !== 'string' || !question.prompt.trim()) {
        question.prompt = 'Pick the correct answer.';
      }

      res.json(question);
    } catch (error) {
      res.status(500).json({ error: error && error.message ? error.message : 'generate failed' });
    }
  });
}
