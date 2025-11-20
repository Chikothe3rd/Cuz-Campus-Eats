import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signUpWithProfileAndRole } from '@/services/auth';

// Mock supabase client to control responses
vi.mock('@/integrations/supabase/client', () => {
  const state: any = {
    signUpResult: { data: { user: { id: 'user123', email: 'test@example.com' } }, error: null },
    existingProfile: { id: 'user123' },
    existingRole: { id: 'role123', role: 'buyer' },
    profileInsertCalls: 0,
    roleInsertCalls: 0,
    failQuery: false,
    signUpError: null,
  };

  const from = (table: string) => {
    const query = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockImplementation(async () => {
        if (table === 'profiles') return { data: state.existingProfile, error: state.failQuery ? { message: 'query failed' } : null };
        if (table === 'user_roles') return { data: state.existingRole, error: null };
        return { data: null, error: null };
      }),
      insert: vi.fn().mockImplementation(async (payload: any) => {
        if (table === 'profiles') state.profileInsertCalls += 1;
        if (table === 'user_roles') state.roleInsertCalls += 1;
        return { data: payload, error: null };
      }),
    };
    return query as any;
  };

  const auth = {
    signUp: vi.fn().mockImplementation(async () => {
      if (state.signUpError) return { data: { user: null }, error: state.signUpError };
      return state.signUpResult;
    }),
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    signInWithPassword: vi.fn(),
  };

  return { supabase: { auth, from }, __supabaseMockState: state };
});

import * as clientModule from '@/integrations/supabase/client';
// Access mock state injected by vi.mock; cast to any since real module lacks this export
const __supabaseMockState: any = (clientModule as any).__supabaseMockState;

describe('signUpWithProfileAndRole', () => {
  beforeEach(() => {
    __supabaseMockState.signUpResult = { data: { user: { id: 'user123', email: 'test@example.com' } }, error: null };
    __supabaseMockState.existingProfile = { id: 'user123' };
    __supabaseMockState.existingRole = { id: 'role123', role: 'buyer' };
    __supabaseMockState.profileInsertCalls = 0;
    __supabaseMockState.roleInsertCalls = 0;
    __supabaseMockState.signUpError = null;
  });

  it('returns early on invalid email', async () => {
    const result = await signUpWithProfileAndRole({
      email: 'bad-email',
      password: 'Password1!',
      name: 'Test',
      role: 'buyer',
    });
    expect(result.error).toMatch(/invalid email/i);
  });

  it('returns early on weak password', async () => {
    const result = await signUpWithProfileAndRole({
      email: 'user@example.com',
      password: 'short',
      name: 'Test',
      role: 'buyer',
    });
    expect(result.error).toMatch(/password must/i);
  });

  it('successful signup with existing profile and role (no inserts)', async () => {
    const result = await signUpWithProfileAndRole({
      email: 'User@Example.com', // tests normalization
      password: 'Password1!',
      name: 'Test User',
      role: 'buyer',
    });
    expect(result.data?.userId).toBe('user123');
    expect(__supabaseMockState.profileInsertCalls).toBe(0);
    expect(__supabaseMockState.roleInsertCalls).toBe(0);
  });

  it('creates profile and role when missing', async () => {
    __supabaseMockState.existingProfile = null;
    __supabaseMockState.existingRole = null;
    const result = await signUpWithProfileAndRole({
      email: 'new@example.com',
      password: 'Password1!',
      name: 'New User',
      role: 'vendor',
    });
    expect(result.data?.userId).toBe('user123');
    expect(__supabaseMockState.profileInsertCalls).toBe(1);
    expect(__supabaseMockState.roleInsertCalls).toBe(1);
  });

  it('handles upstream signup error', async () => {
    __supabaseMockState.signUpError = { message: 'Email already registered' };
    const result = await signUpWithProfileAndRole({
      email: 'dup@example.com',
      password: 'Password1!',
      name: 'Dup User',
      role: 'buyer',
    });
    expect(result.error).toMatch(/email already registered/i);
  });
});
