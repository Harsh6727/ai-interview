import React from "react";
import { useSelector } from "react-redux";
import CandidateTable from "./interviewer/components/CandidateTable";
import AttemptDetailsDialog from "./interviewer/components/AttemptDetailsDialog";
import SearchBar from "./interviewer/components/SearchBar";
import SortMenu from "./interviewer/components/SortMenu";
import { buildCandidateRows } from "./interviewer/utils/buildCandidateRows";

export default function InterviewerTab() {
  const candidates = useSelector((state) => state.candidates.list ?? []);

  const rawRows = buildCandidateRows(candidates);

  const [sortKey, setSortKey] = React.useState("date");
  const [sortOrder, setSortOrder] = React.useState("desc");
  const [query, setQuery] = React.useState("");

  const rows = React.useMemo(() => {
    const base = rawRows.filter((row) => row.finished);

    const qRaw = query.trim();
    const q = qRaw.toLowerCase();
    const isNumericOnly = !!qRaw && /^[\s()+\-]*\d[\d\s()+\-]*$/.test(qRaw);
    const qDigits = qRaw.replace(/\D/g, "");

    const filtered = q
      ? base.filter((row) => {
          const name = String(row.name || "").toLowerCase();
          const email = String(row.email || "").toLowerCase();

          if (isNumericOnly) {
            const phoneDigits = String(row.phone || "").replace(/\D/g, "");
            return qDigits.length > 0 && phoneDigits.includes(qDigits);
          }

          return name.includes(q) || email.includes(q);
        })
      : base;

    const dir = sortOrder === "asc" ? 1 : -1;
    const getTime = (row) => row.finishedAt ?? row.startedAt ?? 0;

    return filtered.sort((left, right) => {
      if (sortKey === "date") {
        return (getTime(left) - getTime(right)) * dir;
      }
      return (left.score - right.score) * dir;
    });
  }, [rawRows, sortKey, sortOrder, query]);

  const [openAttemptId, setOpenAttemptId] = React.useState(null);

  const active = React.useMemo(() => {
    if (!openAttemptId) return null;
    return rawRows.find((row) => row.attemptId === openAttemptId) || null;
  }, [openAttemptId, rawRows]);

  const [openSort, setOpenSort] = React.useState(false);
  const currentLabel = sortKey === "date" ? "Date/Time" : "Score";

  return (
    <div className="">
      <div className="rounded-[24px] border border-white/40 bg-white/20 p-4 shadow-xl backdrop-blur-lg">
        <div className="mb-3 flex items-center justify-between gap-3">
          <SearchBar
            query={query}
            onQueryChange={setQuery}
            onClear={() => setQuery("")}
          />

          <SortMenu
            open={openSort}
            onToggle={() => setOpenSort((open) => !open)}
            onClose={() => setOpenSort(false)}
            sortKey={sortKey}
            sortOrder={sortOrder}
            onSortKeyChange={setSortKey}
            onSortOrderChange={setSortOrder}
            currentLabel={currentLabel}
          />
        </div>

        <CandidateTable rows={rows} onViewAttempt={setOpenAttemptId} />
      </div>

      <AttemptDetailsDialog active={active} onClose={() => setOpenAttemptId(null)} />
    </div>
  );
}
