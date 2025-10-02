const PLAN_ENTRIES = [
  { difficulty: "easy", type: "mcq", time: 20 },
  { difficulty: "easy", type: "project_based", time: 20 },
  { difficulty: "medium", type: "project_based", time: 60 },
  { difficulty: "medium", type: "predict_output", time: 60 },
  { difficulty: "hard", type: "fix_bug", time: 120 },
  { difficulty: "hard", type: "code_write", time: 120 },
];

export const ASSESSMENT_PLAN = Object.freeze(
  PLAN_ENTRIES.map((entry) => Object.freeze({ ...entry }))
);

export const ASSESSMENT_DIFFICULTY_SEQUENCE = Object.freeze(
  ASSESSMENT_PLAN.map((item) => item.difficulty)
);

export const TOTAL_QUESTIONS = ASSESSMENT_PLAN.length;
