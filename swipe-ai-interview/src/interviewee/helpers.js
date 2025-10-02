export const SESSION_PREFIX = 'testSession_v1_';
export const FIVE_MIN = 5 * 60 * 1000;

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
export const isPhone = (v) => /(\+?\d[\d()\-\s]{7,}\d)/.test(v.trim());

export async function toBase64(file) {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const s = String(reader.result || '');
      const b64 = s.includes(',') ? s.split(',')[1] : s;
      resolve(b64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function dedupeAndCap(arr, key, max = 6) {
  const seen = new Set();
  const out = [];
  for (const it of arr) {
    const k = key(it);
    if (!k) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(it);
    if (out.length >= max) break;
  }
  return out;
}

export function normalizeMcqFromResult(raw) {
  const score =
    (typeof raw?.finalScore === 'number' && raw.finalScore) ||
    (typeof raw?.score === 'number' && raw.score) ||
    0;

  const summary = String(raw?.summary ?? raw?.finalSummary ?? '') || '';

  const items =
    (Array.isArray(raw?.graded) && raw.graded) ||
    (Array.isArray(raw?.results) && raw.results) ||
    (Array.isArray(raw?.answers) && raw.answers) ||
    (Array.isArray(raw?.questions) && raw.questions) ||
    (Array.isArray(raw?.items) && raw.items) ||
    (Array.isArray(raw?.qa) && raw.qa) ||
    [];

  const mcqAll = items
    .map((it) => {
      const q = it?.question ?? it;

      const qText = String(q?.prompt ?? q?.question ?? '').trim();
      const options = Array.isArray(q?.options)
        ? q.options.map((o) => String(o))
        : Array.isArray(q?.choices)
        ? q.choices.map((o) => String(o))
        : [];

      if (!qText || options.length === 0) return null;

      const selectedRaw =
        it?.selected ??
        it?.selectedIndex ??
        it?.answerIndex ??
        it?.candidateIndex ??
        it?.chosen ??
        (typeof it?.answer === 'string'
          ? (/^\s*\d+\s*$/.test(it.answer) ? Number(it.answer) : null)
          : typeof it?.answer === 'number'
          ? it?.answer
          : null);

      const selectedIndex =
        typeof selectedRaw === 'number' && Number.isFinite(selectedRaw)
          ? selectedRaw
          : null;

      const correctRaw =
        q?.correct ??
        q?.correctIndex ??
        q?.correct_option ??
        q?.answer ??
        q?.groundTruthIndex;

      const correctIndex =
        typeof correctRaw === 'number' && Number.isFinite(correctRaw)
          ? correctRaw
          : null;

      return {
        question: qText,
        options,
        selectedIndex,
        correctIndex,
      };
    })
    .filter(Boolean);

  const mcq = dedupeAndCap(
    mcqAll,
    (m) => m.question.replace(/\s+/g, ' ').trim().toLowerCase(),
    6
  );

  return { score, summary, mcq };
}

