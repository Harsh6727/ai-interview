export function buildCandidateRows(candidates) {
  const list = Array.isArray(candidates) ? candidates : [];

  return list.flatMap((candidate) => {
    const attempts = Array.isArray(candidate.attempts) ? candidate.attempts : [];

    const mapped = attempts.map((attempt) => {
      const mcq = Array.isArray(attempt.mcq) ? attempt.mcq : [];

      const normalized = mcq
        .filter(Boolean)
        .reduce((acc, cur) => {
          const key = String(cur.question || "")
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase();
          if (!key) return acc;
          const exists = acc.find(
            (item) =>
              String(item.question || "")
                .replace(/\s+/g, " ")
                .trim()
                .toLowerCase() === key
          );
          if (exists) return acc;
          if (acc.length < 6) acc.push(cur);
          return acc;
        }, []);

      const finalSummary = typeof attempt.finalSummary === "string" ? attempt.finalSummary : "";
      const startedAt = typeof attempt.startedAt === "number" ? attempt.startedAt : undefined;
      const finishedAt = typeof attempt.finishedAt === "number" ? attempt.finishedAt : undefined;
      const score = Number.isFinite(attempt.score) ? Number(attempt.score) : 0;

      const finished = Boolean(
        attempt.finished ||
          finishedAt ||
          (normalized && normalized.length > 0) ||
          (finalSummary && finalSummary.trim().length > 0)
      );

      return {
        attemptId:
          attempt.attemptId ?? `${candidate.id}-${finishedAt ?? startedAt ?? "draft"}`,
        candidateId: candidate.id,
        name: candidate.name || "Candidate",
        email: candidate.email,
        phone: candidate.phone,
        score,
        finalSummary,
        startedAt,
        finishedAt,
        mcq: normalized,
        finished,
      };
    });

    const legacy =
      attempts.length === 0 && candidate.finished
        ? [
            {
              attemptId: `${candidate.id}-legacy`,
              candidateId: candidate.id,
              name: candidate.name || "Candidate",
              email: candidate.email,
              phone: candidate.phone,
              score: Number(candidate.score ?? 0),
              finalSummary: String(candidate.finalSummary ?? ""),
              startedAt:
                typeof candidate.startedAt === "number" ? candidate.startedAt : undefined,
              finishedAt:
                typeof candidate.finishedAt === "number" ? candidate.finishedAt : undefined,
              mcq: [],
              finished: true,
            },
          ]
        : [];

    return [...mapped, ...legacy];
  });
}
