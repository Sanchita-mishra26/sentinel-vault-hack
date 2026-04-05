/** Backend origin — keep in sync with Express (default port 5000). */
export const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:5000';

/**
 * Check HTTP status before parsing JSON on success. On error, read text first so
 * non-JSON bodies (HTML, plain text) do not throw inside `res.json()`.
 */
export async function parseJsonResponse<T = unknown>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    let message = text.trim();
    try {
      const parsed = JSON.parse(text) as { message?: string };
      if (parsed && typeof parsed.message === 'string' && parsed.message) {
        message = parsed.message;
      }
    } catch {
      /* use raw text */
    }
    if (!message) message = `${res.status} ${res.statusText}`.trim() || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}
