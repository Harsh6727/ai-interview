export async function openaiFetch(url, init = {}, tries = 5) {
  let lastErr;
  let delay = 800; // backoff in ms

  for (let i = 0; i < tries; i += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);

    try {
      const method = (init.method || 'GET').toUpperCase();
      const needsKey = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
      const headers = new Headers(init.headers || {});
      if (needsKey && !headers.has('Idempotency-Key')) {
        const key =
          globalThis?.crypto?.randomUUID?.() ??
          `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        headers.set('Idempotency-Key', key);
      }

      const res = await fetch(url, { ...init, headers, signal: controller.signal });
      clearTimeout(timeout);

      if (res.ok) return res;

      if ([429, 500, 502, 503, 504, 520, 522, 524].includes(res.status)) {
        await new Promise((resolve) => setTimeout(resolve, delay + Math.floor(Math.random() * 300)));
        delay *= 1.8;
        continue;
      }

      throw new Error(await safeText(res));
    } catch (err) {
      clearTimeout(timeout);
      lastErr = err;
      await new Promise((resolve) => setTimeout(resolve, delay + Math.floor(Math.random() * 300)));
      delay *= 1.8;
    }
  }
  throw new Error(`OpenAI request failed after retries: ${lastErr?.message || lastErr}`);
}

async function safeText(res) {
  try {
    return await res.text();
  } catch {
    return `${res.status} ${res.statusText}`;
  }
}
