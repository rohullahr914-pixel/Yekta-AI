type Entry = { count: number; resetAt: number };
const store = new Map<string, Entry>();
export function rateLimit(key: string, limit = 18, windowMs = 60_000) {
  const now = Date.now(); const current = store.get(key);
  if (!current || now > current.resetAt) { store.set(key, { count: 1, resetAt: now + windowMs }); return { ok: true, remaining: limit - 1 }; }
  if (current.count >= limit) return { ok: false, remaining: 0, retryAfter: Math.ceil((current.resetAt - now) / 1000) };
  current.count += 1; return { ok: true, remaining: limit - current.count };
}
