import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  list: [],
  activeAttemptId: undefined,
  draft: undefined,
};

function newAttemptId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const attemptsSlice = createSlice({
  name: 'attempts',
  initialState,
  reducers: {
    startAttempt(state, { payload }) {
      const id = newAttemptId();

      state.activeAttemptId = id;
      state.draft = {
        id,
        name: payload?.name ?? 'Candidate',
        email: payload?.email,
        phone: payload?.phone,
        startedAt: Date.now(),
      };
    },

    finishWithResult(state, { payload }) {
      const id =
        state.activeAttemptId ??
        newAttemptId();

      const base =
        state.draft?.id === id
          ? state.draft
          : { id, startedAt: Date.now() };

      const { score, summary, mcq } = normalizeMcqFromResult(payload.result);

      const attempt = {
        id,
        name: payload.identity?.name ?? base?.name,
        email: payload.identity?.email ?? base?.email,
        phone: payload.identity?.phone ?? base?.phone,
        startedAt: base?.startedAt ?? Date.now(),
        finishedAt: Date.now(),
        score,
        summary,
        mcq,
      };

      const idx = state.list.findIndex((a) => a.id === id);
      if (idx >= 0) state.list[idx] = { ...state.list[idx], ...attempt };
      else state.list.unshift(attempt);

      state.activeAttemptId = undefined;
      state.draft = undefined;
    },

    clearAttempts(state) {
      state.list = [];
      state.activeAttemptId = undefined;
      state.draft = undefined;
    },
  },
});

export const { startAttempt, finishWithResult, clearAttempts } = attemptsSlice.actions;

export default attemptsSlice.reducer;

export const selectAttempts = (root) => root.attempts.list;

export function normalizeMcqFromResult(raw) {
  const score =
    (typeof raw?.finalScore === 'number' && raw.finalScore) ||
    (typeof raw?.score === 'number' && raw.score) ||
    0;

  const summary = String(raw?.summary ?? raw?.finalSummary ?? '') || '';

  const items =
    (Array.isArray(raw?.graded) && raw.graded) ||
    (Array.isArray(raw?.results) && raw.results) ||
    (Array.isArray(raw?.answers) && raw.answers) ||
    (Array.isArray(raw?.questions) && raw.questions) ||
    (Array.isArray(raw?.items) && raw.items) ||
    (Array.isArray(raw?.qa) && raw.qa) ||
    [];

  const mcq = items
    .map((it) => {
      const questionSource = it?.question ?? it;

      const question = String(questionSource?.prompt ?? questionSource?.question ?? '').trim();

      const options = Array.isArray(questionSource?.options)
        ? questionSource.options.map((o) => String(o))
        : Array.isArray(questionSource?.choices)
        ? questionSource.choices.map((o) => String(o))
        : [];

      const selectedRaw =
        it?.selected ??
        it?.selectedIndex ??
        it?.answerIndex ??
        it?.candidateIndex ??
        it?.chosen ??
        (typeof it?.answer === 'string'
          ? (/^\s*\d+\s*$/.test(it.answer) ? Number(it.answer) : null)
          : typeof it?.answer === 'number'
          ? it?.answer
          : null);

      const selectedIndex =
        typeof selectedRaw === 'number' && Number.isFinite(selectedRaw)
          ? selectedRaw
          : null;

      const correctRaw =
        questionSource?.correct ??
        questionSource?.correctIndex ??
        questionSource?.correct_option ??
        questionSource?.answer ??
        questionSource?.groundTruthIndex;

      const correctIndex =
        typeof correctRaw === 'number' && Number.isFinite(correctRaw)
          ? correctRaw
          : null;

      if (!question || options.length === 0) return null;
      return { question, options, selectedIndex, correctIndex };
    })
    .filter(Boolean);

  return { score, summary, mcq };
}
