export interface RetryOptions {
  retries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

function sleep(ms: number) {
  return new Promise(res => setTimeout(res, ms));
}

function isTransient(e: unknown): boolean {
  const raw = e as { message?: string; status?: number } | string | undefined;
  const msg = typeof raw === 'string' ? raw : String(raw?.message ?? raw);
  const status: number | undefined = typeof raw === 'object' && raw && 'status' in raw ? (raw as { status?: number }).status : undefined;
  // Network / transport issues
  if (/Failed to fetch|NetworkError|connection reset|timeout/i.test(msg)) return true;
  // Transient HTTP statuses
  if (status && [429, 500, 502, 503, 504].includes(status)) return true;
  return false;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { retries = 3, baseDelayMs = 300, maxDelayMs = 4000 } = options;
  let attempt = 0;
  let lastError: unknown;
  while (attempt <= retries) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      if (!isTransient(e) || attempt === retries) break;
  const exponential = baseDelayMs * 2 ** attempt;
  const jitter = exponential * (0.8 + Math.random() * 0.4);
  const delay = Math.min(jitter, maxDelayMs);
      await sleep(delay);
      attempt++;
    }
  }
  throw lastError;
}

export { isTransient };