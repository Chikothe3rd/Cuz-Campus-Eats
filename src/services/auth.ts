import { supabase } from '@/integrations/supabase/client';
import { withRetry } from '@/lib/retry';
import { mapAuthError } from '@/lib/utils';
import { logger } from '@/lib/log';

export type SignUpParams = {
  email: string;
  password: string;
  name: string;
  phone?: string;
  campusName?: string;
  role: 'buyer' | 'vendor' | 'runner';
  onProgress?: (stage: string) => void;
};

export type AuthResult<T = unknown> = {
  data?: T;
  error?: string;
};

export async function signUpWithProfileAndRole(params: SignUpParams): Promise<AuthResult<{ userId: string }>> {
  const { email, password, name, phone, campusName, role, onProgress } = params;
  try {
  // Basic input validation (client-side guardrails before hitting Supabase)
  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalizedEmail)) {
    return { error: 'Invalid email format' };
  }
  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters' };
  }
  if (!['buyer','vendor','runner'].includes(role)) {
    return { error: 'Invalid role specified' };
  }
  onProgress?.('Creating auth account');
  logger.info('Auth signup started', { email });
    const { data: authData, error: authError } = await withRetry(() => supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: { name, phone, campus_name: campusName, role },
        emailRedirectTo: `${window.location.origin}/`,
      },
    }));
    if (authError) throw authError;
    if (!authData.user) throw new Error('No user returned from signup');
    const userId = authData.user.id;

  onProgress?.('Checking profile record');
    const { data: existingProfile, error: profileFetchError } = await withRetry(async () => {
      return await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
    });
    if (profileFetchError && profileFetchError.code !== 'PGRST116') throw profileFetchError;

    if (!existingProfile) {
  onProgress?.('Creating profile');
  logger.info('Creating profile row', { userId });
      const { error: profileInsertError } = await withRetry(async () => {
        return await supabase.from('profiles').insert({
          id: userId,
          email: normalizedEmail,
          name,
          phone: phone || null,
          campus_name: campusName || null,
        });
      });
      if (profileInsertError) throw profileInsertError;
    }

  onProgress?.('Checking user role');
    const { data: existingRole, error: roleFetchError } = await withRetry(async () => {
      return await supabase
        .from('user_roles')
        .select('id, role')
        .eq('user_id', userId)
        .maybeSingle();
    });
    if (roleFetchError && roleFetchError.code !== 'PGRST116') throw roleFetchError;

    if (!existingRole) {
  onProgress?.('Assigning role');
  logger.info('Assigning role', { userId, role });
      const { error: roleError } = await withRetry(async () => {
        return await supabase
          .from('user_roles')
          .insert({ user_id: userId, role });
      });
      if (roleError) throw roleError;
    }

    onProgress?.('Completed');
    logger.info('Signup complete', { userId });
    return { data: { userId } };
  } catch (e) {
    logger.error('Signup failed', { email, error: e });
    return { error: mapAuthError(e) };
  }
}

export async function signIn(email: string, password: string): Promise<AuthResult<{ userId: string; role?: string }>> {
  try {
    logger.info('Sign in attempt', { email });
    const { data: authData, error } = await withRetry(() => supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password,
    }));
    if (error) throw error;
    if (!authData.user) throw new Error('No user returned from sign in');
    const userId = authData.user.id;
    // Fetch all roles; choose first if multiple
    const { data: roles, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    if (roleError) {
      logger.warn('Role fetch error on sign in', { userId, error: roleError });
    }
    const role = roles && roles.length > 0 ? roles[0].role : undefined;
    logger.info('Sign in success', { userId, role });
    return { data: { userId, role } };
  } catch (e) {
    logger.error('Sign in failed', { email, error: e });
    return { error: mapAuthError(e) };
  }
}

export async function getUserRole(userId: string): Promise<AuthResult<{ role?: string }>> {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();
    if (error && error.code !== 'PGRST116') throw error;
    return { data: { role: data?.role } };
  } catch (e) {
    return { error: mapAuthError(e) };
  }
}

export async function signOut(): Promise<AuthResult> {
  try {
    logger.info('Sign out attempt');
    const { error } = await withRetry(() => supabase.auth.signOut());
    if (error) throw error;
    logger.info('Sign out success');
    return { data: undefined };
  } catch (e) {
    logger.error('Sign out failed', { error: e });
    return { error: mapAuthError(e) };
  }
}
