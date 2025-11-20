import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signIn } from '@/services/auth';

vi.mock('@/integrations/supabase/client', () => {
  const state: any = {
    signInError: null,
    roles: [{ role: 'buyer' }, { role: 'vendor' }],
  };

  const from = (table: string) => {
    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      // For signIn we call .select().eq(); just return array of roles
      // Supabase client would normally resolve with { data, error }
      then: undefined,
      // Simulate query execution by awaiting the object directly via a promise wrapper in service
      // We'll provide a custom awaitable using async function style methods (service uses await directly)
      // Easiest: expose data property synchronously via casting in test environment by returning plain object in signIn call.
    } as any;
  };

  // Patch signInWithPassword to return a user
  const auth = {
    signInWithPassword: vi.fn().mockImplementation(async () => {
      if (state.signInError) return { data: { user: null }, error: state.signInError };
      return { data: { user: { id: 'user123', email: 'test@example.com' } }, error: null };
    })
  } as any;

  // We need supabase.from(...).select(...).eq(...): the service calls .select('role').eq('user_id', userId)
  // Then awaits the returned object which should have data/error keys.
  // Simplify by returning an object with those keys directly when .select is eventually awaited.
  const fromProxy = (table: string) => {
    return {
      select: () => ({
        eq: () => ({ data: state.roles, error: null })
      })
    } as any;
  };

  return { supabase: { auth, from: fromProxy }, __supabaseMockState: state };
});

import * as clientModule from '@/integrations/supabase/client';
const __supabaseMockState: any = (clientModule as any).__supabaseMockState;

describe('signIn', () => {
  beforeEach(() => {
    __supabaseMockState.signInError = null;
    __supabaseMockState.roles = [{ role: 'buyer' }, { role: 'vendor' }];
  });

  it('returns the first role when multiple roles exist', async () => {
    const result = await signIn('test@example.com', 'Password1!');
    expect(result.data?.userId).toBe('user123');
    expect(result.data?.role).toBe('buyer');
  });

  it('handles no roles gracefully', async () => {
    __supabaseMockState.roles = [];
    const result = await signIn('test@example.com', 'Password1!');
    expect(result.data?.userId).toBe('user123');
    expect(result.data?.role).toBeUndefined();
  });

  it('maps sign in error', async () => {
    __supabaseMockState.signInError = { message: 'Invalid login credentials' };
    const result = await signIn('test@example.com', 'WrongPassword');
    expect(result.error).toMatch(/invalid email or password/i);
  });
});
