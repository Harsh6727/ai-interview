import { ASSESSMENT_PLAN } from "@/lib/assessmentPlan";

export const PLAN = ASSESSMENT_PLAN;

const validDiff = new Set(["easy", "medium", "hard"]);
const validType = new Set(["mcq", "project_based", "predict_output", "fix_bug", "code_write"]);

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const toNumOrNull = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length) {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

export const normalizeGrade = (raw) => {
  if (raw && typeof raw === "object") {
    const maybeTotal =
      toNumOrNull(raw.total) ??
      toNumOrNull(raw.score) ??
      (typeof raw.value === "number" ? raw.value : null);
    const total = clamp(maybeTotal ?? 0, 0, 10);
    return {
      total,
      seo: toNumOrNull(raw.seo) ?? undefined,
      initial_load: toNumOrNull(raw.initial_load ?? raw.initialLoad) ?? undefined,
      ux: toNumOrNull(raw.ux) ?? undefined,
      complexity: toNumOrNull(raw.complexity) ?? undefined,
      scenarios: toNumOrNull(raw.scenarios) ?? undefined,
    };
  }
  const total = clamp(toNumOrNull(raw) ?? 0, 0, 10);
  return { total };
};

export const sanitizeQuestion = (raw, fallback) => {
  const difficulty = validDiff.has(raw?.difficulty) ? raw.difficulty : fallback.difficulty;
  const type = validType.has(raw?.type) ? raw.type : fallback.type;
  const prompt = String(raw?.prompt || "Question unavailable. Please try again.");
  const id = String(raw?.id || `q-${Date.now()}`);
  const time_limit_seconds = Number(raw?.time_limit_seconds) > 0 ? Number(raw.time_limit_seconds) : fallback.time;
  const options = Array.isArray(raw?.options) ? raw.options.map((o) => String(o)) : null;

  return {
    id,
    difficulty,
    type,
    prompt,
    language: typeof raw?.language === "string" ? raw.language : null,
    starter_code: typeof raw?.starter_code === "string" ? raw.starter_code : null,
    options,
    correct_option: typeof raw?.correct_option === "number" ? raw.correct_option : null,
    expected_output: typeof raw?.expected_output === "string" ? raw.expected_output : null,
    rubric: typeof raw?.rubric === "string" ? raw.rubric : null,
    time_limit_seconds,
  };
};

export const SESSION_KEY = (id) => `testSession_v1_${id}`;
export const FIVE_MIN = 5 * 60 * 1000;
