import 'server-only';
// Per-instance guard, in addition to authentication and upstream quotas. No persistent personal data.
const windows = new Map();
export function allowRequest(key, max, windowMs = 60000) {
  const now = Date.now();
  if (windows.size > 2000) for (const [k, value] of windows) if (value.reset <= now) windows.delete(k);
  if (windows.size > 4000 && !windows.has(key)) return false;
  const value = windows.get(key);
  if (!value || value.reset <= now) { windows.set(key, { count: 1, reset: now + windowMs }); return true; }
  if (value.count >= max) return false;
  value.count += 1; return true;
}
