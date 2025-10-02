import { createSlice } from '@reduxjs/toolkit';
import { ASSESSMENT_DIFFICULTY_SEQUENCE } from '@/lib/assessmentPlan';

const createInitialState = () => ({
  currentCandidateId: null,
  currentQuestionIndex: 0,
  status: 'idle',
  timer: 0,
  difficulty: [...ASSESSMENT_DIFFICULTY_SEQUENCE],
  pausedAt: undefined,
});

const initialState = createInitialState();

const interviewSlice = createSlice({
  name: 'interview',
  initialState,
  reducers: {
    startInterview(state, action) {
      state.currentCandidateId = action.payload;
      state.currentQuestionIndex = 0;
      state.status = 'in-progress';
      state.timer = 0;
      state.pausedAt = undefined;
    },
    setStatus(state, action) {
      state.status = action.payload;
    },
    setTimer(state, action) {
      state.timer = action.payload;
    },
    nextQuestion(state) {
      state.currentQuestionIndex += 1;
      state.timer = 0;
    },
    pauseInterview(state, action) {
      state.status = 'paused';
      state.pausedAt = action.payload;
    },
    resumeInterview(state) {
      state.status = 'in-progress';
      state.pausedAt = undefined;
    },
    resetInterview(state) {
      Object.assign(state, createInitialState());
    },
  },
});

export const { startInterview, setStatus, setTimer, nextQuestion, pauseInterview, resumeInterview, resetInterview } =
  interviewSlice.actions;
export default interviewSlice.reducer;

