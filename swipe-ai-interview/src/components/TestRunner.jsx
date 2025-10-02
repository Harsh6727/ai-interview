import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";

import { useAppDispatch } from "@/store";
import { upsert, setFinalSummary, setScore, setFinished } from "@/store/candidatesSlice";

import { PLAN, FIVE_MIN, SESSION_KEY, normalizeGrade, sanitizeQuestion } from "./test-runner/helpers";
import ResumeDialog from "./test-runner/ResumeDialog";
import StartScreen from "./test-runner/StartScreen";
import QuestionView from "./test-runner/QuestionView";

export default function TestRunner({
  role = "full-stack (React/Node)",
  resumeText = "",
  resumeBehavior = "prompt",

  candidateId: candidateIdProp,
  name: nameProp,
  email: emailProp,
  phone: phoneProp,

  onFinish,
  onClose,
}) {
  const dispatch = useAppDispatch();

  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);

  const [question, setQuestion] = useState(null);
  const [nextQuestion, setNextQuestion] = useState(null);

  const [secondsLeft, setSecondsLeft] = useState(0);
  const [answer, setAnswer] = useState("");
  const [graded, setGraded] = useState([]);
  const [history, setHistory] = useState([]);

  // Welcome back (resume) modal
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [resumeState, setResumeState] = useState(null);

  const timerRef = useRef(null);
  const prefetchingRef = useRef(false);
  const submittingRef = useRef(false); // using to prevent double submission
  const finalizingRef = useRef(false); 

  const sessionSalt = useMemo(
    () =>
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    []
  );

  // Stable candidate identity 
  const candidateId =
    candidateIdProp ||
    (typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `cand-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const name = nameProp || "Candidate";
  const email = emailProp ?? null;
  const phone = phoneProp ?? null;

  useEffect(() => {
    if (!candidateId) return;
    dispatch(
      upsert({
        id: candidateId,
        name: name || undefined,
        email: email || undefined,
        phone: phone || undefined,
      })
    );
  }, [candidateId, name, email, phone]);

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
    },
    []
  );

  // Timer
  useEffect(() => {
    if (secondsLeft <= 0 || !started) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleSubmit(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [secondsLeft, started]);

  // Detect resumable session on mount
  useEffect(() => {
    if (resumeBehavior === "off") return;
    try {
      const k = SESSION_KEY(candidateId);
      const raw = localStorage.getItem(k);
      if (!raw) return;
      const data = JSON.parse(raw);
      const last = Number(data?.leftAt || data?.updatedAt || 0);
      if (!last) return;

      if (Date.now() - last <= FIVE_MIN) {
        if (resumeBehavior === "auto") {
          // Immediately resume without showing this component's dialog
          applyResume(data);
          setWelcomeOpen(false);
        } else {
          setResumeState(data);
          setWelcomeOpen(true);
        }
      } else {
        localStorage.removeItem(k);
      }
    } catch {
    }
  }, [candidateId, resumeBehavior]);

  useEffect(() => {
    if (!started) return;
    try {
      const payload = {
        candidateId,
        idx,
        question,
        nextQuestion,
        secondsLeft,
        answer,
        started,
        graded,
        history,
        updatedAt: Date.now(),
      };
      localStorage.setItem(SESSION_KEY(candidateId), JSON.stringify(payload));
    } catch {}
  }, [candidateId, idx, question, nextQuestion, secondsLeft, answer, started, graded, history]);

  useEffect(() => {
    const handler = () => {
      try {
        const k = SESSION_KEY(candidateId);
        const raw = localStorage.getItem(k);
        if (raw) {
          const obj = JSON.parse(raw);
          obj.leftAt = Date.now();
          localStorage.setItem(k, JSON.stringify(obj));
        }
      } catch {}
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [candidateId]);

  const applyResume = (data) => {
    try {
      setIdx(Number.isFinite(data.idx) ? data.idx : 0);
      setQuestion(data.question ?? null);
      setNextQuestion(data.nextQuestion ?? null);
      setSecondsLeft(Number.isFinite(data.secondsLeft) ? data.secondsLeft : 0);
      setAnswer(typeof data.answer === "string" ? data.answer : "");
      setGraded(Array.isArray(data.graded) ? data.graded : []);
      setHistory(Array.isArray(data.history) ? data.history : []);
      setStarted(true);
      if (Number.isFinite(data.idx)) void prefetchNext(data.idx);
    } catch {
      start();
    }
  };

  const generateForIndex = async (index) => {
    const plan = PLAN[index];
    const nonce = `${sessionSalt}-${index}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const res = await fetch("/api/test/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        spec: {
          difficulty: plan.difficulty,
          type: plan.type,
          role,
          resumeText: index === 2 ? resumeText : "",
          timeLimitSec: plan.time,
          nonce,
          history,
        },
      }),
    });
    const raw = await res.json();
    return sanitizeQuestion(raw, plan);
  };

  const prefetchNext = async (index) => {
    if (index >= PLAN.length - 1 || prefetchingRef.current) return;
    prefetchingRef.current = true;
    try {
      const q = await generateForIndex(index + 1);
      setNextQuestion(q);
    } catch {
      setNextQuestion(null);
    } finally {
      prefetchingRef.current = false;
    }
  };

  const start = async () => {
    setLoading(true);
    try {
      dispatch(
        upsert({
          id: candidateId,
          name,
          email,
          phone,
        })
      );

      // clear any stale session
      try {
        localStorage.removeItem(SESSION_KEY(candidateId));
      } catch {}

      const first = await generateForIndex(0);
      setQuestion(first);
      setSecondsLeft(first.time_limit_seconds || PLAN[0].time);
      setHistory((h) => [...h, first.prompt]);
      setStarted(true);
      void prefetchNext(0);
    } catch {
      const fallback = sanitizeQuestion(
        {
          id: `local-${Date.now()}`,
          difficulty: PLAN[0].difficulty,
          type: PLAN[0].type,
          prompt: "Question unavailable.",
          time_limit_seconds: PLAN[0].time,
        },
        PLAN[0]
      );
      setQuestion(fallback);
      setSecondsLeft(fallback.time_limit_seconds);
      setHistory((h) => [...h, fallback.prompt]);
      setStarted(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (_auto = false) => {
    if (!question) return;
    if (submittingRef.current) return; 
    submittingRef.current = true;

    setLoading(true);
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const payloadAnswer = answer.trim(); 
      const attempted = payloadAnswer.length > 0;

      let gradedItem;

      if (!attempted) {
        gradedItem = { question, answer: "", grade: undefined, feedback: undefined };
      } else {
        const res = await fetch("/api/test/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question, answer: payloadAnswer }),
        });

        let gradeObj;
        let feedback;

        if (res.ok) {
          const raw = await res.json();
          gradeObj = normalizeGrade(raw); 
          feedback = typeof raw?.feedback === "string" ? raw.feedback : undefined;
        } else {
          gradeObj = undefined;
          feedback = undefined;
        }

        gradedItem = { question, answer: payloadAnswer, grade: gradeObj, feedback };
      }

      setGraded((prev) => [...prev, gradedItem]);

      // Next or Finish
      if (idx < PLAN.length - 1) {
        const nextIdx = idx + 1;

        if (nextQuestion) {
          const q = nextQuestion;
          setQuestion(q);
          setSecondsLeft(q.time_limit_seconds || PLAN[nextIdx].time);
          setAnswer("");
          setIdx(nextIdx);
          setNextQuestion(null);
          setHistory((h) => [...h, q.prompt]);
          void prefetchNext(nextIdx);
        } else {
          const q = await generateForIndex(nextIdx);
          setQuestion(q);
          setSecondsLeft(q.time_limit_seconds || PLAN[nextIdx].time);
          setAnswer("");
          setIdx(nextIdx);
          setHistory((h) => [...h, q.prompt]);
          void prefetchNext(nextIdx);
        }
      } else {
        if (finalizingRef.current) return;
        finalizingRef.current = true;

        try {
          const summaryRes = await fetch("/api/test/summary", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              perQuestionMax: 10,
              questions: [...graded, gradedItem].map((gi) => ({
                id: gi.question?.id ?? gi.question?.prompt?.slice(0, 40) ?? crypto.randomUUID(),
                answer: gi.answer ?? "",
                score: typeof gi.grade?.total === "number" ? { total: gi.grade.total } : undefined,
              })),
            }),
          });

          const summary = await summaryRes.json();
          dispatch(
            upsert({
              id: candidateId,
              name,
              email,
              phone,
            })
          );
          dispatch(setScore({ id: candidateId, score: Number(summary.finalScore ?? 0) }));
          dispatch(setFinalSummary({ id: candidateId, finalSummary: String(summary.summary ?? "") }));
          dispatch(setFinished({ id: candidateId, finished: true }));

          try {
            localStorage.removeItem(SESSION_KEY(candidateId));
          } catch {}

          onFinish?.({
            finalScore: summary.finalScore ?? 0,
            summary: summary.summary ?? "",
            graded: [...graded, gradedItem],
          });
        } finally {
          finalizingRef.current = false;
        }
      }
    } catch {
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  const diffLabel = String(question?.difficulty || "easy").toUpperCase();
  const typeLabel = String(question?.type || "mcq");
  const handleResume = () => {
    setWelcomeOpen(false);
    if (resumeState) applyResume(resumeState);
  };

  return (
    <Card className="w-full max-w-3xl mx-auto p-4 md:p-6 max-h-[80vh] overflow-y-auto">
      <ResumeDialog
        open={resumeBehavior === "prompt" && welcomeOpen}
        onOpenChange={setWelcomeOpen}
        onResume={handleResume}
      />

      {!started ? (
        <StartScreen loading={loading} onStart={start} />
      ) : (
        <QuestionView
          answer={answer}
          diffLabel={diffLabel}
          idx={idx}
          loading={loading}
          onAnswerChange={setAnswer}
          onSubmit={() => handleSubmit(false)}
          question={question}
          secondsLeft={secondsLeft}
          totalQuestions={PLAN.length}
          typeLabel={typeLabel}
        />
      )}
    </Card>
  );
}
