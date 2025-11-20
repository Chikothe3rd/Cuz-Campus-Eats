import { withRetry } from '@/lib/retry';

// A helper that fails twice then succeeds
function createFlakyTask(timesToFail: number) {
  let attempts = 0;
  return async () => {
    attempts++;
    if (attempts <= timesToFail) {
      const err = new Error('Failed to fetch');
      // @ts-expect-error custom status for testing
      err.status = 503;
      throw err;
    }
    return 'ok';
  };
}

it('retries transient failures and eventually succeeds', async () => {
  const result = await withRetry(createFlakyTask(2), { retries: 4, baseDelayMs: 10 });
  expect(result).toBe('ok');
});

it('throws after exceeding retries', async () => {
  await expect(withRetry(createFlakyTask(5), { retries: 2, baseDelayMs: 10 })).rejects.toThrow('Failed to fetch');
});
