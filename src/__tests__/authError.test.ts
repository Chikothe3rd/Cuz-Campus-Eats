import { mapAuthError } from '@/lib/utils';

describe('mapAuthError', () => {
  it('maps network fetch errors', () => {
    const msg = mapAuthError(new Error('Failed to fetch'));
    expect(msg).toMatch(/Network error/i);
  });

  it('maps missing env errors', () => {
    const msg = mapAuthError(new Error('Supabase is not configured'));
    expect(msg).toMatch(/configuration missing/i);
  });

  it('falls back to original message', () => {
    const original = 'Some other error';
    const msg = mapAuthError(new Error(original));
    expect(msg).toBe(original);
  });
});
