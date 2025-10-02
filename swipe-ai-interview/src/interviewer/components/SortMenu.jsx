import { Button } from "@/components/ui/button";
import { ARROW_DOWN, ARROW_UP } from "../constants";

export default function SortMenu({
  open,
  onToggle,
  onClose,
  sortKey,
  sortOrder,
  onSortKeyChange,
  onSortOrderChange,
  currentLabel,
}) {
  const arrow = sortOrder === "asc" ? ARROW_UP : ARROW_DOWN;

  return (
    <div className="relative">
      <Button
        onClick={onToggle}
        className="inline-flex h-9 items-center gap-2 rounded-2xl border border-yellow-300 bg-gradient-to-r from-yellow-200 to-yellow-100 px-4 font-medium text-indigo-900 hover:from-yellow-300 hover:to-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-300/60"
      >
        <span>Sort</span>
        <span className="inline-block rounded-full border border-yellow-300 bg-white/70 px-2 py-0.5 text-xs">
          {currentLabel} {arrow}
        </span>
      </Button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-56 rounded-lg border bg-white shadow-lg">
          <div className="px-3 py-2 text-xs text-muted-foreground">Sort by</div>
          <button
            className={`block w-full px-3 py-2 text-left text-sm hover:bg-muted/40 ${
              sortKey === "date" ? "bg-muted/30 font-medium" : ""
            }`}
            onClick={() => {
              onSortKeyChange("date");
              onClose();
            }}
          >
            Date/Time
          </button>
          <button
            className={`block w-full px-3 py-2 text-left text-sm hover:bg-muted/40 ${
              sortKey === "score" ? "bg-muted/30 font-medium" : ""
            }`}
            onClick={() => {
              onSortKeyChange("score");
              onClose();
            }}
          >
            Score
          </button>

          <div className="my-1 border-t" />

          <div className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground">
            <span>Order</span>
            <div className="inline-flex overflow-hidden rounded-md border">
              <button
                className={`px-2 py-1 text-xs ${
                  sortOrder === "asc" ? "bg-muted/40 font-medium" : "bg-white"
                }`}
                onClick={() => onSortOrderChange("asc")}
              >
                Asc
              </button>
              <button
                className={`px-2 py-1 text-xs ${
                  sortOrder === "desc" ? "bg-muted/40 font-medium" : "bg-white"
                }`}
                onClick={() => onSortOrderChange("desc")}
              >
                Desc
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
