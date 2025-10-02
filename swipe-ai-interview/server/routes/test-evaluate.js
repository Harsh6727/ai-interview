const DEFAULT_RUBRIC = `Score each dimension 0-2 (integers). A strong answer is accurate, compares trade-offs, references concrete examples and edge cases, and is technically sound. Be consistent.`;

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function int012(value) {
  const v = Math.round(Number(value) || 0);
  return clamp(v, 0, 2);
}

function ok(score) {
  const seo = int012(score.seo);
  const initial_load = int012(score.initial_load);
  const ux = int012(score.ux);
  const complexity = int012(score.complexity);
  const scenarios = int012(score.scenarios);
  const total = clamp(
    typeof score.total === 'number'
      ? Math.round(score.total)
      : seo + initial_load + ux + complexity + scenarios,
    0,
    10
  );
  return {
    total,
    seo,
    initial_load,
    ux,
    complexity,
    scenarios,
    justification: (score.justification || 'Automated grading.').toString().slice(0, 1200),
  };
}

function mcqScore(answer, question) {
  const selected = Number(answer);
  const correct = Number(question.correct_option);
  const sub = selected === correct ? 2 : 0;
  return ok({
    seo: sub,
    initial_load: sub,
    ux: sub,
    complexity: sub,
    scenarios: sub,
    total: sub * 5,
    justification: selected === correct
      ? 'Selected the correct option.'
      : 'Selected an incorrect option.',
  });
}

function predictScore(answer, question) {
  const got = String(answer || '').trim();
  const exp = String(question.expected_output || '').trim();
  const sub = got.length && exp.length && got === exp ? 2 : 0;
  return ok({
    seo: sub,
    initial_load: sub,
    ux: sub,
    complexity: sub,
    scenarios: sub,
    total: sub * 5,
    justification: sub ? 'Output matches expected exactly.' : 'Output differs from expected.',
  });
}

async function gradeWithLLM(apiKey, questionText, rubricText, answerText) {
  const model = process.env.OPENAI_EVAL_MODEL || 'chatgpt-4o-latest';
  const jsonSchema = {
    name: 'WebAnswerScore',
    schema: {
      type: 'object',
      additionalProperties: false,
      required: ['total', 'seo', 'initial_load', 'ux', 'complexity', 'scenarios', 'justification'],
      properties: {
        total: { type: 'number', minimum: 0, maximum: 10 },
        seo: { type: 'number', minimum: 0, maximum: 2 },
        initial_load: { type: 'number', minimum: 0, maximum: 2 },
        ux: { type: 'number', minimum: 0, maximum: 2 },
        complexity: { type: 'number', minimum: 0, maximum: 2 },
        scenarios: { type: 'number', minimum: 0, maximum: 2 },
        justification: { type: 'string', minLength: 20, maxLength: 1200 },
      },
    },
    strict: true,
  };

  const prompt = [
    `Question:\n${questionText}\n`,
    `Rubric (strict):\n${rubricText}\n`,
    `Candidate answer:\n${answerText}\n`,
    'Score integer subs (0/1/2) across: seo, initial_load, ux, complexity, scenarios.',
    'total = sum (0..10). justification must reference specifics. Return ONLY JSON per schema.',
  ].join('\n');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: 'json_schema', json_schema: jsonSchema },
      messages: [
        { role: 'system', content: 'You are a strict, consistent grader for web engineering answers.' },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => '');
    throw new Error(`OpenAI ${response.status}: ${err}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content ?? '{}';
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('Could not parse LLM JSON.');
  }

  const score = ok(parsed);
  return ok({
    seo: score.seo,
    initial_load: score.initial_load,
    ux: score.ux,
    complexity: score.complexity,
    scenarios: score.scenarios,
    total: score.seo + score.initial_load + score.ux + score.complexity + score.scenarios,
    justification: score.justification,
  });
}

export function registerTestEvaluateRoutes(app) {
  app.get('/api/test/evaluate', (_req, res) => {
    res.json({ ok: true, use: 'POST { question, answer, rubric? }' });
  });

  app.post('/api/test/evaluate', async (req, res) => {
    const apiKey = process.env.OPENAI_API_KEY;
    const body = req.body ?? {};

    const answer =
      (typeof body.answer === 'string' && body.answer) ||
      (typeof body.candidate_answer === 'string' && body.candidate_answer) ||
      (typeof body.submission === 'string' && body.submission) ||
      '';

    if (!answer.trim()) {
      res.json(
        ok({
          seo: 0,
          initial_load: 0,
          ux: 0,
          complexity: 0,
          scenarios: 0,
          total: 0,
          justification: 'No answer provided; graded as 0.',
        })
      );
      return;
    }

    const questionRaw = body.question ?? body.prompt ?? '';
    const question = typeof questionRaw === 'object' && questionRaw ? questionRaw : { type: undefined, prompt: String(questionRaw || '') };
    const questionText = (question.prompt && question.prompt.trim()) || String(body.question || body.prompt || 'Web engineering question');
    const rubric =
      (question.rubric && question.rubric.trim()) ||
      (typeof body.rubric === 'string' ? body.rubric.trim() : '') ||
      DEFAULT_RUBRIC;

    try {
      if (question.type === 'mcq' && typeof question.correct_option === 'number') {
        res.json(mcqScore(answer, question));
        return;
      }
      if (question.type === 'predict_output' && typeof question.expected_output === 'string') {
        res.json(predictScore(answer, question));
        return;
      }

      if (!apiKey) {
        res.json(
          ok({
            seo: 0,
            initial_load: 0,
            ux: 0,
            complexity: 0,
            scenarios: 0,
            total: 0,
            justification: 'OPENAI_API_KEY not set; returning 0.',
          })
        );
        return;
      }

      try {
        const graded = await gradeWithLLM(apiKey, questionText, rubric, answer);
        res.json(graded);
      } catch (err) {
        res.json(
          ok({
            seo: 0,
            initial_load: 0,
            ux: 0,
            complexity: 0,
            scenarios: 0,
            total: 0,
            justification: `Evaluator unavailable: ${err?.message || 'error'}. Returning 0.`,
          })
        );
      }
    } catch (err) {
      res.json(
        ok({
          seo: 0,
          initial_load: 0,
          ux: 0,
          complexity: 0,
          scenarios: 0,
          total: 0,
          justification: `Evaluation crashed: ${err?.message || 'unknown'}. Returning 0.`,
        })
      );
    }
  });
}
