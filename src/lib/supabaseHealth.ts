import { supabase } from '@/integrations/supabase/client';

/**
 * Lightweight ping to verify Supabase connectivity & basic auth state.
 * - Performs a trivial SELECT against `profiles` (cheap, cached by PostgREST)
 * - Measures latency
 * - Distinguishes configuration vs network vs RLS/schema issues
 */
export async function pingSupabase(): Promise<{
  ok: boolean;
  latencyMs?: number;
  reason?: 'not-configured' | 'network' | 'query-failed';
  errorMessage?: string;
}> {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined;

  if (!url || !key) {
    return { ok: false, reason: 'not-configured', errorMessage: 'Missing VITE_SUPABASE_URL or key env vars.' };
  }

  // Network reachability (HEAD is cheap; any status other than network error counts as reachable)
  try {
    await fetch(`${url}/rest/v1/`, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
  } catch (e) {
    return { ok: false, reason: 'network', errorMessage: e instanceof Error ? e.message : String(e) };
  }

  // Simple query
  const start = performance.now();
  const { error } = await supabase.from('profiles').select('id').limit(1);
  const latencyMs = Math.round(performance.now() - start);

  if (error) {
    return { ok: false, latencyMs, reason: 'query-failed', errorMessage: error.message };
  }
  return { ok: true, latencyMs };
}

/**
 * Production readiness checklist (static evaluation of config only).
 * Use this in CI or startup diagnostics.
 */
export function evaluateSupabaseConfig(): {
  warnings: string[];
  recommendations: string[];
} {
  const warnings: string[] = [];
  const recommendations: string[] = [];
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  const pub = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

  if (!url) warnings.push('VITE_SUPABASE_URL is missing.');
  if (!anon && !pub) warnings.push('No public key (VITE_SUPABASE_ANON_KEY or VITE_SUPABASE_PUBLISHABLE_KEY) set.');

  if (url?.includes('localhost')) {
    warnings.push('Using a localhost Supabase URL in what appears to be a production build.');
    recommendations.push('Switch to hosted project URL before deploying.');
  }
  recommendations.push('Never expose service_role key in client code or frontend env vars.');
  recommendations.push('Rotate anon key if leaked; revoke old key via Supabase dashboard.');
  recommendations.push('Enable email confirmations & rate limiting in Supabase Auth settings.');
  return { warnings, recommendations };
}
