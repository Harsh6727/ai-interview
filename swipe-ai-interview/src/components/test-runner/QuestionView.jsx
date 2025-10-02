import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Timer, Send } from "lucide-react";
import { cn } from "@/lib/utils";

const QuestionView = ({
  answer,
  diffLabel,
  idx,
  loading,
  onAnswerChange,
  onSubmit,
  question,
  secondsLeft,
  totalQuestions,
  typeLabel,
}) => {
  if (!question) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 text-white">
        <Loader2 className="h-4 w-4 animate-spin" />
        Preparing your next question...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
            {diffLabel}
          </span>
          <span className="inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium">
            {typeLabel}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Timer className="w-4 h-4" />
          <span>{secondsLeft}s</span>
        </div>
      </div>

      <div className="bg-muted/30 rounded-lg p-4 whitespace-pre-wrap">{question.prompt}</div>

      {question.starter_code && (
        <pre className="bg-black text-white rounded-lg p-3 overflow-auto text-sm max-h-[40vh]">
          <code>{question.starter_code}</code>
        </pre>
      )}

      {/* Answer UI */}
      {question.type === "mcq" ? (
        <div className="flex flex-col gap-2">
          {(question.options || []).map((opt, i) => (
            <label
              key={i}
              className={cn(
                "flex items-center gap-2 rounded-lg border p-3 cursor-pointer",
                answer === String(i) ? "border-primary ring-2 ring-primary/40" : "border-muted"
              )}
            >
              <input
                type="radio"
                name={`mcq-${question.id}`}
                value={i}
                checked={answer === String(i)}
                onChange={(e) => onAnswerChange(e.target.value)}
                className="accent-primary"
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      ) : question.type === "predict_output" ? (
        <Input
          placeholder="Enter the program?s final output?"
          value={answer}
          onChange={(e) => onAnswerChange(e.target.value)}
        />
      ) : (
        <textarea
          className="min-h-[140px] w-full rounded-md border bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          placeholder={
            question.type === "fix_bug"
              ? "Paste the fixed code and briefly explain the bug."
              : "Explain clearly and concisely."
          }
          value={answer}
          onChange={(e) => onAnswerChange(e.target.value)}
        />
      )}

      <div className="flex items-center justify-between pt-2">
        <div className="text-xs text-muted-foreground">
          Question {idx + 1} / {totalQuestions}
        </div>
        <Button onClick={onSubmit} disabled={loading} className="font-semibold text-white">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
          Submit
        </Button>
      </div>
    </div>
  );
};

export default QuestionView;
