import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CHECK, CROSS, EM_DASH } from "../constants";

export default function AttemptDetailsDialog({ active, onClose }) {
  return (
    <Dialog open={!!active} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{`Final Details : ${active?.name ?? "Candidate"}`}</DialogTitle>
        </DialogHeader>

        <div className="px-7 py-6 overflow-y-auto min-h-0">
          {active && (
            <div className="mx-auto max-w-4xl space-y-6">
              <div className="grid grid-cols-2 gap-6 text-sm md:grid-cols-4">
                <div>
                  <div className="text-indigo-700/80">Email</div>
                  <div className="font-medium">{active.email || EM_DASH}</div>
                </div>
                <div>
                  <div className="text-indigo-700/80">Phone</div>
                  <div className="font-medium">{active.phone || EM_DASH}</div>
                </div>
                <div>
                  <div className="text-indigo-700/80">Score</div>
                  <div className="font-medium">{active.score}</div>
                </div>
                <div>
                  <div className="text-indigo-700/80">Started</div>
                  <div className="font-medium">
                    {active.startedAt ? new Date(active.startedAt).toLocaleString() : EM_DASH}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 shadow-sm">
                <div className="mb-1 text-sm font-medium text-yellow-900/80">Final summary</div>
                <p className="whitespace-pre-wrap leading-relaxed text-gray-900">
                  {active.finalSummary || EM_DASH}
                </p>
              </div>

              <div className="space-y-4">
                <div className="text-sm font-medium text-purple-800/80">Questions</div>

                {active.mcq.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No MCQ details captured.</div>
                ) : (
                  <ol className="list-decimal space-y-6 pl-5">
                    {active.mcq.map((item, index) => (
                      <li key={index} className="space-y-3">
                        <div className="font-medium text-gray-900">{item.question}</div>
                        {item.selectedIndex == null && (
                          <div className="mt-1 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700">
                            Not attempted
                          </div>
                        )}
                        <ul className="space-y-2">
                          {(item.options ?? []).map((option, idx) => {
                            const isSelected = item.selectedIndex === idx;
                            const isCorrect = item.correctIndex === idx;

                            const base = "rounded-md border p-3 text-sm whitespace-pre-wrap";
                            const neutral = "border-slate-200 bg-white";
                            const correctCls = "border-green-300 bg-green-50 text-green-900";
                            const wrongSelCls = "border-red-300 bg-red-50 text-red-900";

                            const cls =
                              isCorrect && isSelected
                                ? correctCls
                                : isCorrect
                                ? correctCls
                                : isSelected
                                ? wrongSelCls
                                : neutral;

                            return (
                              <li key={idx} className={`${base} ${cls}`}>
                                <div className="flex items-start justify-between">
                                  <span>
                                    <span className="mr-2 font-semibold">
                                      {String.fromCharCode(65 + idx)}.
                                    </span>
                                    {option}
                                  </span>

                                  {isSelected && isCorrect && (
                                    <span className="ml-3 text-xs font-semibold text-green-700">
                                      {`Selected ${CHECK}`}
                                    </span>
                                  )}
                                  {isSelected && !isCorrect && (
                                    <span className="ml-3 text-xs font-semibold text-red-700">
                                      {`Selected ${CROSS}`}
                                    </span>
                                  )}
                                  {!isSelected && isCorrect && (
                                    <span className="ml-3 text-xs font-semibold text-green-700">
                                      {`Correct ${CHECK}`}
                                    </span>
                                  )}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={onClose}
            className="h-9 px-5 font-medium text-indigo-900 bg-gradient-to-r from-yellow-200 to-yellow-100 border border-yellow-300 hover:from-yellow-300 hover:to-yellow-200 focus:ring-2 focus:ring-yellow-300/60 focus:outline-none"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
