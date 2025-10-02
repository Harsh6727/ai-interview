import { createSlice } from '@reduxjs/toolkit';

const initialState = { list: [] };

function newId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const candidatesSlice = createSlice({
  name: 'candidates',
  initialState,
  reducers: {
    finishWithResult: (state, { payload }) => {
      const now = Date.now();

      let candidate = state.list.find((x) => x.id === payload.id);
      if (!candidate) {
        candidate = {
          id: payload.id,
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          attempts: [],
          startedAt: now,
        };
        state.list.unshift(candidate);
      } else {
        candidate.name = payload.name ?? candidate.name;
        candidate.email = payload.email ?? candidate.email;
        candidate.phone = payload.phone ?? candidate.phone;
      }

      const mcq = Array.isArray(payload.mcq) ? payload.mcq : [];
      const numericScore = Number(payload.score);
      const score = Number.isFinite(numericScore) ? numericScore : 0;
      const finalSummary = String(payload.finalSummary ?? '');

      let draftIdx = -1;
      for (let i = candidate.attempts.length - 1; i >= 0; i -= 1) {
        const attempt = candidate.attempts[i];
        const isDraft =
          !attempt?.finishedAt &&
          (!attempt?.mcq || attempt.mcq.length === 0) &&
          (!attempt?.finalSummary || attempt.finalSummary.trim() === '');
        if (isDraft) {
          draftIdx = i;
          break;
        }
      }

      const attempt = {
        attemptId:
          payload.attemptId ??
          (draftIdx >= 0 ? candidate.attempts[draftIdx].attemptId : newId()),
        startedAt: draftIdx >= 0 ? candidate.attempts[draftIdx].startedAt ?? now : now,
        finishedAt: now,
        score,
        finalSummary,
        mcq,
      };

      if (draftIdx >= 0) candidate.attempts[draftIdx] = attempt;
      else candidate.attempts.push(attempt);

      candidate.score = score;
      candidate.finalSummary = finalSummary;
      candidate.finishedAt = now;
      candidate.finished = payload.finished ?? true;
    },

    upsert: (state, { payload }) => {
      let candidate = state.list.find((x) => x.id === payload.id);
      if (!candidate) {
        state.list.unshift({
          id: payload.id,
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          attempts: [],
        });
        return;
      }
      candidate.name = payload.name ?? candidate.name;
      candidate.email = payload.email ?? candidate.email;
      candidate.phone = payload.phone ?? candidate.phone;
    },

    setScore: (state, { payload }) => {
      const candidate = state.list.find((x) => x.id === payload.id);
      if (candidate) {
        const value = Number(payload.score);
        candidate.score = Number.isFinite(value) ? value : candidate.score ?? 0;
      }
    },

    setFinalSummary: (state, { payload }) => {
      const candidate = state.list.find((x) => x.id === payload.id);
      if (candidate) candidate.finalSummary = String(payload.finalSummary ?? '');
    },

    setFinished: (state, { payload }) => {
      const candidate = state.list.find((x) => x.id === payload.id);
      if (!candidate) return;
      if (!payload.finished) {
        candidate.finished = false;
        return;
      }
      const hasCompleted =
        Array.isArray(candidate.attempts) &&
        candidate.attempts.some(
          (attempt) =>
            !!attempt.finishedAt ||
            (attempt.mcq && attempt.mcq.length > 0) ||
            (attempt.finalSummary && attempt.finalSummary.trim())
        );
      if (hasCompleted) {
        candidate.finished = true;
        candidate.finishedAt = candidate.finishedAt ?? Date.now();
      }
    },

    clearCandidates: (state) => {
      state.list = [];
    },
  },
});

export const { finishWithResult, upsert, setScore, setFinalSummary, setFinished, clearCandidates } =
  candidatesSlice.actions;

export default candidatesSlice.reducer;