function firstString(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length) return value;
  }
  return null;
}

function toNumOrNull(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length) {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function numOrUndef(value, min, max) {
  const parsed = toNumOrNull(value);
  return parsed === null ? undefined : clamp(parsed, min, max);
}

function hasAnyScore(question) {
  const score = question?.score ?? question?.scores ?? question?.result ?? null;
  return !!(score && typeof score === 'object');
}

function deriveTotal(question, perQuestionMax) {
  if (question.isCorrect === true) return perQuestionMax;
  if (question.isCorrect === false) return 0;

  const selected =
    question.selectedOption ??
    question.selected ??
    question.chosenAnswer ??
    question.userAnswer ??
    question.answerKey;
  const correct =
    question.correctOption ??
    question.correct ??
    question.key ??
    question.groundTruth;

  if (selected !== undefined && correct !== undefined) {
    return String(selected).trim() === String(correct).trim() ? perQuestionMax : 0;
  }
  return undefined;
}

function normalizeScore(score) {
  if (!score || typeof score !== 'object') return null;
  const total = toNumOrNull(score.total ?? score.overall ?? score.sum);
  if (total === null) return null;
  return {
    total: clamp(total, 0, 10),
    seo: numOrUndef(score.seo, 0, 2),
    initial_load: numOrUndef(score.initial_load ?? score.initialLoad, 0, 2),
    ux: numOrUndef(score.ux, 0, 2),
    complexity: numOrUndef(score.complexity, 0, 2),
    scenarios: numOrUndef(score.scenarios, 0, 2),
  };
}

const RUBRIC_KEYS = ['seo', 'initial_load', 'ux', 'complexity', 'scenarios'];
const RUBRIC_LABELS = {
  seo: 'SEO',
  initial_load: 'Initial Load',
  ux: 'UX',
  complexity: 'Complexity',
  scenarios: 'Scenarios',
};
const RUBRIC_TIPS = {
  SEO: 'Explain how React SSR versus CSR choices affect search crawl, hydration, and metadata freshness.',
  'Initial Load': 'Describe how you keep React bundles lean, stream content, and use caching for a quick first render.',
  UX: 'Share how you shape React UX flows, responsiveness, and accessible interactions.',
  Complexity: 'Clarify your Node.js service design, data layering, and operational trade-offs.',
  Scenarios: 'Walk through real React/Node project scenarios, edge cases, and fallback paths.',
};
const RUBRIC_SUMMARY_DESCRIPTORS = {
  SEO: 'React SEO awareness',
  'Initial Load': 'React rendering performance',
  UX: 'React UX judgement',
  Complexity: 'Node.js service design',
  Scenarios: 'scenario planning across React and Node workflows',
};

function normalizeQuestion(raw, perQuestionMax, idx) {
  const answer =
    firstString(
      raw.answer,
      raw.candidate_answer,
      raw.submission,
      raw.response,
      raw.content,
      raw.text,
      raw.value,
      raw.message
    ) || '';
  const answerPreview = String(answer).slice(0, 1200);

  const score = normalizeScore(raw.score ?? raw.scores ?? raw.result);
  const hadChoice =
    raw.selectedOption ?? raw.selected ?? raw.chosenAnswer ?? raw.userAnswer ?? raw.answerKey !== undefined;
  const isCorrect = typeof raw.isCorrect === 'boolean' ? raw.isCorrect : undefined;
  const derivedTotal = typeof score?.total === 'number' ? undefined : deriveTotal(raw, perQuestionMax);

  const attempted =
    answerPreview.trim().length > 0 ||
    hasAnyScore(raw) ||
    typeof isCorrect === 'boolean' ||
    hadChoice;

  const evaluated = typeof score?.total === 'number' || typeof derivedTotal === 'number';

  return {
    id: firstString(raw.id, raw.questionId, raw._id, raw.uid, raw.key) || `q_${idx}`,
    answer_preview: answerPreview,
    score,
    derivedTotal,
    attempted,
    evaluated,
    hadChoice,
    isCorrect,
  };
}

function buildFallbackSummary({
  finalScore,
  status,
  count,
  maxScore,
  attemptedCount,
  evaluatedCount,
  attemptedRate,
  evaluatedRate,
  scorePercent,
  averagePerQuestion,
  averageEvaluatedScore,
  fullCreditCount,
  zeroScoreCount,
  rubricSummary,
  rubricMissing,
  ratingOutOfTen,
}) {
  const descriptorSentences = {
    excellent: 'The candidate demonstrates expert React and Node.js proficiency across architectural and implementation scenarios.',
    strong: 'The candidate shows strong, job-ready React and Node.js capability with clear awareness of trade-offs.',
    fair: 'The candidate brings developing React and Node.js skill with emerging command of core concepts.',
    limited: 'The candidate has foundational React and Node.js understanding and is building toward production readiness.',
    'very limited': 'The candidate is still forming React and Node.js fundamentals and benefits from hands-on guidance.',
    undetermined: 'Available answers do not yet present a complete view of React and Node.js proficiency.',
  };

  const readinessStatements = {
    excellent: 'Ready to lead complex React and Node.js initiatives today.',
    strong: 'Prepared for production assignments and on track for broader ownership soon.',
    fair: 'Ready for guided production work and will ramp quickly with mentorship.',
    limited: 'Best suited for a collaborative environment that supports hands-on learning.',
    'very limited': 'Needs structured mentorship before owning production deliverables but shows positive drive.',
    undetermined: 'Share a fuller set of evaluated responses to finalize readiness; attitude appears constructive.',
  };

  const friendlyLabel = (label) => RUBRIC_SUMMARY_DESCRIPTORS[label] ?? RUBRIC_TIPS[label] ?? label;

  const buildList = (values) => {
    if (!values.length) return '';
    if (values.length === 1) return values[0];
    if (values.length === 2) return `${values[0]} and ${values[1]}`;
    return `${values.slice(0, -1).join(', ')}, and ${values[values.length - 1]}`;
  };

  const ensureSentence = (text) => {
    const trimmed = text.trim();
    if (!trimmed.length) return '';
    return trimmed.endsWith('.') ? trimmed : `${trimmed}.`;
  };

  const formatRating = (value) => {
    if (!Number.isFinite(value)) return null;
    const clamped = Math.max(0, Math.min(10, value));
    const fixed = clamped.toFixed(1);
    const display = fixed.endsWith('.0') ? fixed.slice(0, -2) : fixed;
    return `${display}/10`;
  };

  if (status === 'not_attempted') {
    const ratingText = formatRating(5) ?? '5/10';
    const summaryLines = [
      `Overall Skill Level - React and Node.js skill cannot be confirmed without submissions, so we are holding a conservative ${ratingText} until examples are provided.`,
      'Strengths - The candidate shows initiative by entering the process and should showcase their problem-solving approach next.',
      'Readiness / Potential - Encourage the candidate to resubmit with complete answers so their growth trajectory can be evaluated fairly.',
    ];
    return {
      finalScore,
      status,
      summary: summaryLines.join(' '),
      tips: ['Answer each question before submitting.', 'Allocate time per question to ensure completeness.'],
    };
  }

  if (status === 'not_evaluated') {
    const ratingText = formatRating(5.5) ?? '5.5/10';
    const summaryLines = [
      `Overall Skill Level - Grading did not complete, so we are provisionally setting the React/Node rating at ${ratingText} until evaluation finishes.`,
      'Strengths - The candidate demonstrated follow-through by submitting responses and appears ready to engage with feedback.',
      'Readiness / Potential - Re-run evaluation to unlock a complete profile; with clear grading they are positioned to grow quickly.',
    ];
    return {
      finalScore,
      status,
      summary: summaryLines.join(' '),
      tips: ['Retry the evaluation later.', 'Ensure a stable connection before submitting.'],
    };
  }

  const sortedRubric = Array.isArray(rubricSummary) ? [...rubricSummary] : [];
  sortedRubric.sort((a, b) => b.average - a.average);
  const toLabels = (items) => items.map((item) => item.label);

  const strengthBuckets = sortedRubric.filter((item) => item.average >= 1.5).slice(0, 2);
  if (!strengthBuckets.length && sortedRubric.length) strengthBuckets.push(sortedRubric[0]);

  const weaknessBuckets = sortedRubric.filter((item) => item.average <= 1.25).slice(0, 2);
  if (!weaknessBuckets.length && sortedRubric.length) weaknessBuckets.push(sortedRubric[sortedRubric.length - 1]);

  const strengthLabelsRaw = toLabels(strengthBuckets);
  const weaknessLabelsRaw = [
    ...toLabels(weaknessBuckets),
    ...(Array.isArray(rubricMissing) ? rubricMissing : []),
  ]
    .filter((label, index, arr) => label && arr.indexOf(label) === index)
    .slice(0, 3);

  const strengthLabels = strengthLabelsRaw.map(friendlyLabel);
  const weaknessLabels = weaknessLabelsRaw.map(friendlyLabel);

  const descriptorKey = (() => {
    if (!Number.isFinite(scorePercent)) return 'undetermined';
    if (scorePercent >= 90) return 'excellent';
    if (scorePercent >= 75) return 'strong';
    if (scorePercent >= 55) return 'fair';
    if (scorePercent > 0) return 'limited';
    return 'very limited';
  })();

  const ratingText =
    formatRating(
      Number.isFinite(ratingOutOfTen)
        ? ratingOutOfTen
        : Number.isFinite(scorePercent)
        ? scorePercent / 10
        : null
    ) ?? '6/10';

  const coverageDescriptor = (() => {
    if (!Number.isFinite(attemptedRate) && !Number.isFinite(evaluatedRate)) {
      return 'Additional submissions will provide a fuller view of recent work.';
    }
    if (Number.isFinite(attemptedRate) && attemptedRate < 60) {
      return 'Responses covered only part of the prompts, so more examples would enrich the assessment.';
    }
    if (Number.isFinite(attemptedRate) && attemptedRate < 90) {
      return 'Some prompts were only lightly answered, suggesting more depth can still be shared.';
    }
    if (Number.isFinite(evaluatedRate) && evaluatedRate < 90) {
      return 'Completing evaluation for the remaining prompts will round out the picture.';
    }
    return 'Responses addressed most prompts, providing reliable visibility into current abilities.';
  })();

  const strengthStatement = (() => {
    if (strengthLabels.length === 1) {
      return `Showed promising judgement in ${strengthLabels[0]}`;
    }
    if (strengthLabels.length > 1) {
      return `Demonstrated balanced strengths across ${buildList(strengthLabels)}`;
    }
    if (descriptorKey === 'excellent' || descriptorKey === 'strong') {
      return 'Displays confident collaboration and problem-solving instincts within React and Node.js contexts';
    }
    if (descriptorKey === 'fair') {
      return 'Exhibits adaptability and a growing toolkit for React and Node.js decision making';
    }
    return 'Brings curiosity, resilience, and openness to feedback when facing React and Node.js challenges';
  })();

  const growthNotes = [];
  if (weaknessLabels.length) {
    growthNotes.push(`Focus next on ${buildList(weaknessLabels)} to accelerate progress.`);
  }
  if (Number.isFinite(zeroScoreCount) && zeroScoreCount > 0) {
    growthNotes.push('Reinforce baseline implementation steps so every response reflects the same quality.');
  }
  if (coverageDescriptor.includes('Responses covered only part') || coverageDescriptor.includes('Some prompts were only lightly answered')) {
    growthNotes.push('Provide fuller explanations on remaining prompts to showcase complete thinking.');
  }
  if (coverageDescriptor.includes('Completing evaluation')) {
    growthNotes.push('Re-run evaluation on outstanding prompts to confirm strengths and gaps.');
  }
  if (!growthNotes.length) {
    growthNotes.push(
      descriptorKey === 'excellent'
        ? 'Channel this momentum into mentoring and cross-team architecture efforts.'
        : descriptorKey === 'strong'
        ? 'Expand exposure to larger-scale systems to deepen impact even further.'
        : descriptorKey === 'fair'
        ? 'Pair targeted coaching on advanced patterns with continued project delivery.'
        : descriptorKey === 'limited'
        ? 'Embrace structured practice and pairing on production tasks to build confidence steadily.'
        : descriptorKey === 'very limited'
        ? 'Commit to a focused learning plan to translate enthusiasm into dependable delivery.'
        : 'Share additional evaluated scenarios to highlight decision-making depth.'
    );
  }

  const growthTargets = growthNotes.map(ensureSentence).join(' ');

  const overallLine = [
    `Overall Skill Level - ${descriptorSentences[descriptorKey] ?? descriptorSentences.undetermined} Rated ${ratingText}.`,
    coverageDescriptor ? ensureSentence(coverageDescriptor) : '',
  ]
    .filter(Boolean)
    .join(' ');

  const strengthsLine = ensureSentence(`Strengths - ${strengthStatement}`);

  const readinessStatement = readinessStatements[descriptorKey] ?? readinessStatements.undetermined;
  const readinessLine = ensureSentence(`Readiness / Potential - ${readinessStatement} ${growthTargets}`.trim());

  const summary = [overallLine, strengthsLine, readinessLine].filter(Boolean).join(' ');

  const tips = [];
  const weaknessQueue = weaknessLabelsRaw.length ? weaknessLabelsRaw : RUBRIC_KEYS.map((key) => RUBRIC_LABELS[key]);
  for (const label of weaknessQueue) {
    const friendly = friendlyLabel(label);
    const tip = RUBRIC_TIPS[label] ?? `Deepen your practical examples around ${friendly}.`;
    if (!tips.includes(tip) && tips.length < 5) tips.push(tip);
  }
  for (const note of growthNotes) {
    if (tips.length >= 5) break;
    if (!tips.includes(note)) tips.push(note);
  }
  if (tips.length < 3) {
    tips.push('Partner with peers or mentors to review React and Node.js design choices in real projects.');
  }

  return {
    finalScore,
    status,
    summary,
    tips,
  };
}

export function registerTestSummaryRoutes(app) {
  app.get('/api/test/summary', (_req, res) => {
    res.json({ ok: true, use: 'POST /api/summary with { questions:[...], perQuestionMax? }' });
  });

  app.post('/api/test/summary', async (req, res) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'OPENAI_API_KEY not set' });
      return;
    }

    const body = req.body ?? {};
    const incoming = Array.isArray(body.questions)
      ? body.questions
      : Array.isArray(body.perQuestionEvals)
      ? body.perQuestionEvals
      : [];

    const perQuestionMax =
      typeof body.perQuestionMax === 'number'
        ? body.perQuestionMax
        : typeof body.perQuestionMax === 'string'
        ? Number.parseFloat(body.perQuestionMax) || 10
        : 10;

    if (incoming.length === 0) {
      res.json({
        finalScore: 0,
        status: 'not_attempted',
        summary:
          "No recognizable question data was provided. Send an array under 'questions' where each item includes either an answer, a score, isCorrect, or selectedOption.",
        tips: [
          "Send 'questions: [{ id, answer?, score?, isCorrect?, selectedOption?, correctOption? }]'",
          "Do not drop zero scores; include 'score: { total: 0 }' for wrong answers.",
        ],
      });
      return;
    }

    const byId = new Map();
    for (const item of incoming) {
      const id = firstString(item.id, item.questionId, item._id, item.uid, item.key) || '';
      const prev = byId.get(id);
      if (!prev) {
        byId.set(id, item);
      } else {
        const prevScore = hasAnyScore(prev);
        const currentScore = hasAnyScore(item);
        const prevAnswerLen = (firstString(prev.answer, prev.text, prev.submission, prev.response) || '').length;
        const currentAnswerLen = (firstString(item.answer, item.text, item.submission, item.response) || '').length;
        const better = (currentScore && !prevScore) || currentAnswerLen > prevAnswerLen;
        byId.set(id, better ? item : prev);
      }
    }

    const items = Array.from(byId.values());
    const norm = items.map((question, idx) => normalizeQuestion(question, perQuestionMax, idx));

    const attemptedCount = norm.filter((item) => item.attempted).length;
    const evaluatedCount = norm.filter((item) => item.evaluated).length;

    const scores = norm.map((item) => {
      if (typeof item.score?.total === 'number') return item.score.total;
      if (typeof item.derivedTotal === 'number') return item.derivedTotal;
      return null;
    });

    const finalScore = scores.reduce((sum, value) => (typeof value === 'number' ? sum + value : sum), 0);

    const maxScore = perQuestionMax * norm.length;
    const scorePercent = maxScore > 0 ? Number(((finalScore / maxScore) * 100).toFixed(2)) : null;
    const averagePerQuestion = norm.length ? Number((finalScore / norm.length).toFixed(3)) : null;
    const evaluatedScores = scores.filter((value) => typeof value === 'number');
    const averageEvaluatedScore = (
      evaluatedScores.length > 0
        ? Number((evaluatedScores.reduce((sum, value) => sum + value, 0) / evaluatedScores.length).toFixed(3))
        : null
    );
    const fullCreditCount = (
      perQuestionMax > 0
        ? evaluatedScores.filter((value) => value >= perQuestionMax - 1e-9).length
        : null
    );
    const zeroScoreCount = evaluatedScores.filter((value) => value <= 0).length;
    const attemptedRate = norm.length ? Number(((attemptedCount / norm.length) * 100).toFixed(2)) : null;
    const evaluatedRate = norm.length ? Number(((evaluatedCount / norm.length) * 100).toFixed(2)) : null;
    const ratingOutOfTen = Number.isFinite(scorePercent) ? Number((scorePercent / 10).toFixed(2)) : null;

    const rubricTotals = RUBRIC_KEYS.reduce((acc, key) => {
      acc[key] = { sum: 0, count: 0, max: Number.NEGATIVE_INFINITY, min: Number.POSITIVE_INFINITY };
      return acc;
    }, {});
    norm.forEach((item) => {
      RUBRIC_KEYS.forEach((key) => {
        const value = typeof item.score?.[key] === 'number' ? item.score[key] : null;
        if (value === null) return;
        const metrics = rubricTotals[key];
        metrics.sum += value;
        metrics.count += 1;
        metrics.max = Math.max(metrics.max, value);
        metrics.min = Math.min(metrics.min, value);
      });
    });
    const rubricSummary = RUBRIC_KEYS.map((key) => {
      const metrics = rubricTotals[key];
      if (!metrics.count) return null;
      return {
        key,
        label: RUBRIC_LABELS[key],
        average: Number((metrics.sum / metrics.count).toFixed(3)),
        attempts: metrics.count,
        best: Number(metrics.max.toFixed(3)),
        worst: Number(metrics.min.toFixed(3)),
      };
    }).filter(Boolean);
    const rubricRanked = [...rubricSummary].sort((a, b) => b.average - a.average);
    const rubricMissing = RUBRIC_KEYS.filter((key) => !rubricTotals[key].count).map((key) => RUBRIC_LABELS[key]);

    const allEvaluatedTotals = norm.every(
      (item) => typeof item.score?.total === 'number' || typeof item.derivedTotal === 'number'
    );

    const perfect =
      allEvaluatedTotals &&
      norm.every((item) => {
        const value =
          typeof item.score?.total === 'number'
            ? item.score.total
            : item.derivedTotal ?? 0;
        return value === perQuestionMax;
      });

    let status;
    if (attemptedCount === 0) status = 'not_attempted';
    else if (evaluatedCount === 0) status = 'not_evaluated';
    else if (finalScore === 0) status = 'all_zero';
    else if (perfect) status = 'perfect';
    else status = 'partial';

    const summaryPayload = {
      perQuestionMax,
      questionsCount: norm.length,
      attemptedCount,
      evaluatedCount,
      finalScore,
      maxScore,
      scorePercent,
      averagePerQuestion,
      averageEvaluatedScore,
      attemptedRate,
      evaluatedRate,
      fullCreditCount,
      zeroScoreCount,
      ratingOutOfTen,
      rubricSummary: rubricRanked,
      rubricMissing,
      status,
      items: norm.map((item) => ({
        id: item.id,
        attempted: item.attempted,
        evaluated: item.evaluated,
        total: typeof item.score?.total === 'number' ? item.score.total : item.derivedTotal ?? null,
        hasAnswer: item.answer_preview.trim().length > 0,
        hadChoice: item.hadChoice,
        isCorrect: item.isCorrect,
      })),
    };

    const rules = `
  You will receive JSON with facts about an interview evaluation, including a precomputed "status".
  Write exactly three complete sentences formatted as:
  1. Overall Skill Level - Balanced assessment of React and Node.js proficiency that explicitly includes "rated X/10" (replace X with the provided ratingOutOfTen or best inference) and references both technologies.
  2. Strengths - Highlight positive qualities, skills, or emerging potential demonstrated in the responses. Even with limited evidence, infer constructive strengths (e.g., adaptability, collaboration, curiosity) instead of stating none.
  3. Readiness / Potential - Provide an encouraging, professional statement about the candidate's current stage and likely growth path, mentioning the next focus areas.

  Additional guidance:
  - Use insights from finalScore, maxScore, scorePercent, attemptedRate, evaluatedRate, ratingOutOfTen, rubricSummary, and rubricMissing to support your judgement.
  - If status is "not_attempted" or "not_evaluated", infer a fair assessment, acknowledge the gap, and keep the tone encouraging.
  - If status is "all_zero": note that every graded response missed expectations but still highlight positive intent and growth recommendations.
  - If status is "perfect": celebrate the strength while suggesting continued growth.
  - If status is "partial": deliver a balanced view of existing strengths and growth focus.
  - Avoid placeholders such as "none observed" or "pending review". Provide constructive, human-sounding observations instead.
  - Keep the tone professional, objective, and constructive.

  Also supply 2-5 actionable tips when status is "all_zero" or "partial". Tips should reinforce strengths while pointing to focused improvements and may include qualitative references to rubric areas.
  Return ONLY JSON { finalScore, status, summary, tips? }.
  `;

    const model = process.env.OPENAI_SUMMARY_MODEL || 'gpt-4.1-mini';
    const jsonSchema = {
      name: 'InterviewSummary',
      schema: {
        type: 'object',
        additionalProperties: false,
        required: ['finalScore', 'status', 'summary'],
        properties: {
          finalScore: { type: 'number', minimum: 0 },
          status: { type: 'string', enum: ['not_attempted', 'not_evaluated', 'all_zero', 'partial', 'perfect'] },
          summary: { type: 'string', minLength: 30, maxLength: 1200 },
          tips: {
            type: 'array',
            items: { type: 'string', minLength: 5, maxLength: 240 },
            minItems: 0,
            maxItems: 5,
          },
        },
      },
      strict: true,
    };

    let aiSummary = null;
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          temperature: 0,
          response_format: { type: 'json_schema', json_schema: jsonSchema },
          messages: [
            { role: 'system', content: 'You are a strict but fair interview summarizer. Follow the rules precisely.' },
            { role: 'user', content: `${rules}\n\nInput:\n${JSON.stringify(summaryPayload)}` },
          ],
        }),
      });

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content ?? '';
      if (content && content.trim().startsWith('{')) {
        aiSummary = JSON.parse(content);
      }
    } catch {
      aiSummary = null;
    }

    if (!aiSummary) {
      const fallback = buildFallbackSummary({
        finalScore,
        status,
        count: norm.length,
        maxScore,
        attemptedCount,
        evaluatedCount,
        attemptedRate,
        evaluatedRate,
        scorePercent,
        averagePerQuestion,
        averageEvaluatedScore,
        fullCreditCount,
        zeroScoreCount,
        ratingOutOfTen,
        rubricSummary: rubricRanked,
        rubricMissing,
      });
      res.json(fallback);
      return;
    }

    aiSummary.finalScore = finalScore;
    aiSummary.status = status;
    res.json(aiSummary);
  });
}
