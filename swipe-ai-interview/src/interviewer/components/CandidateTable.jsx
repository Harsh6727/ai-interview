import { Button } from "@/components/ui/button";
import { EM_DASH } from "../constants";

export default function CandidateTable({ rows, onViewAttempt }) {
  return (
    <div className="overflow-x-auto rounded-2xl border">
      <table className="min-w-full text-sm">
        <thead className="bg-white/60 text-indigo-700/80">
          <tr>
            <th className="px-6 py-3 text-left">Name</th>
            <th className="px-6 py-3 text-left">Email</th>
            <th className="px-6 py-3 text-left">Phone</th>
            <th className="px-6 py-3 text-left">Score</th>
            <th className="px-6 py-3 text-left">Summary</th>
          </tr>
        </thead>
        <tbody className="bg-white/80">
          {rows.map((row) => (
            <tr key={row.attemptId} className="border-t">
              <td className="px-6 py-4">{row.name}</td>
              <td className="px-6 py-4">{row.email || EM_DASH}</td>
              <td className="px-6 py-4">{row.phone || EM_DASH}</td>
              <td className="px-6 py-4 font-semibold">{row.score}</td>
              <td className="px-6 py-4">
                <Button
                  onClick={() => onViewAttempt(row.attemptId)}
                  className="h-9 px-5 font-medium text-indigo-900 bg-gradient-to-r from-yellow-200 to-yellow-100 border border-yellow-300 hover:from-yellow-300 hover:to-yellow-200 focus:ring-2 focus:ring-yellow-300/60 focus:outline-none"
                >
                  View
                </Button>
              </td>
            </tr>
          ))}

          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">
                No finished candidates yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
