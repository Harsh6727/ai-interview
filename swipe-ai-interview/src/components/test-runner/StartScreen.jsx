import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { ASSESSMENT_DIFFICULTY_SEQUENCE, TOTAL_QUESTIONS } from "@/lib/assessmentPlan";

const formatLabel = (value) => value.charAt(0).toUpperCase() + value.slice(1);

const PLAN_DESCRIPTION = (() => {
  if (ASSESSMENT_DIFFICULTY_SEQUENCE.length === 0) {
    return "No questions configured.";
  }

  const groups = [];
  let current = ASSESSMENT_DIFFICULTY_SEQUENCE[0];
  let count = 0;

  for (const diff of ASSESSMENT_DIFFICULTY_SEQUENCE) {
    if (diff === current) {
      count += 1;
    } else {
      groups.push(`${count} ${formatLabel(current)}`);
      current = diff;
      count = 1;
    }
  }

  groups.push(`${count} ${formatLabel(current)}`);

  const detail = groups.join(", ");
  return `${TOTAL_QUESTIONS} questions (${detail}) shown one at a time.`;
})();

const StartScreen = ({ loading, onStart }) => {
  return (
    <div className="flex flex-col items-center gap-4 py-10">
      <h2 className="text-xl font-bold">Timed Coding Assessment</h2>
      <p className="text-sm text-muted-foreground text-center">{PLAN_DESCRIPTION}</p>
      <Button onClick={onStart} className="font-semibold text-white">
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Preparing...
          </>
        ) : (
          "Start Test"
        )}
      </Button>
    </div>
  );
};

export default StartScreen;
