/**
 * Convex wraps thrown server errors into noisy strings such as
 * "[Request ID: …] Server Error\nUncaught Error: …\n at handler (…)".
 * This keeps the human readable part and drops the request id and stack.
 */
export function friendlyError(error: unknown, fallback = "Что-то пошло не так"): string {
  if (!error) return fallback;
  const raw = error instanceof Error ? error.message : String(error);

  const thrown = raw.match(/Uncaught Error: ([^\n]+)/);
  if (thrown) return thrown[1].trim();
  if (raw.includes("Server Error")) return fallback;

  const cleaned = raw.replace(/^\[Request ID:[^\]]*\]\s*/, "").trim();
  return cleaned || fallback;
}
