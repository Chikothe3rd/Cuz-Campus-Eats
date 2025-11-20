import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { mapAuthError } from '@/lib/utils';

interface HealthDetails {
  url: string;
  hasKey: boolean;
  canQueryProfiles: boolean;
  sessionStatus: string;
  currentUser: string;
  profilesLatencyMs?: number;
  sessionLatencyMs?: number;
}

type Status = 'idle' | 'checking' | 'healthy' | 'degraded' | 'error';

const SupabaseHealth = () => {
  const [status, setStatus] = useState<Status>('idle');
  const [details, setDetails] = useState<HealthDetails | null>(null);
  const [error, setError] = useState<string>('');

  const runCheck = async () => {
    setStatus('checking');
    setError('');
    setDetails(null);
    try {
  // Access URL/key from environment rather than protected properties
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const hasKey = !!(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY);

  if (!url || !hasKey) {
    setStatus('error');
    setError('Supabase not configured. See SUPABASE_SETUP_REQUIRED.md for setup instructions.');
    return;
  }

  // Test network reachability first
  try {
    const healthUrl = `${url}/rest/v1/`;
    const healthResponse = await fetch(healthUrl, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
    // Any response (even 401) means server is reachable
  } catch (fetchError) {
    const msg = fetchError instanceof Error ? fetchError.message : String(fetchError);
    if (msg.includes('DNS') || msg.includes('ENOTFOUND') || msg.includes('NetworkError')) {
      setStatus('error');
      setError(`Cannot reach Supabase server at ${url}. The project may not exist or has been deleted. See SUPABASE_SETUP_REQUIRED.md`);
      return;
    }
  }

  const startProfiles = performance.now();
  const { error: profilesError } = await supabase.from('profiles').select('id').limit(1);
  const profilesLatency = Math.round(performance.now() - startProfiles);

  const startSession = performance.now();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  const sessionLatency = Math.round(performance.now() - startSession);

      if (sessionError) throw sessionError;

      const canQueryProfiles = !profilesError;
      const sessionStatus = sessionData.session ? 'Active' : 'No Session';
      const currentUser = sessionData.session?.user?.email || '—';

      setDetails({
        url: url || '—',
        hasKey,
        canQueryProfiles,
        sessionStatus,
        currentUser,
        profilesLatencyMs: profilesLatency,
        sessionLatencyMs: sessionLatency,
      });

      if (hasKey && url && canQueryProfiles) {
        setStatus('healthy');
      } else if (url && hasKey && !canQueryProfiles) {
        setStatus('degraded');
        setError('Connected but failed to query profiles table. Check table existence or RLS policies.');
      } else {
        setStatus('error');
      }
    } catch (e) {
      setStatus('error');
      setError(mapAuthError(e));
    }
  };

  useEffect(() => {
    runCheck();
  }, []);

  const icon = () => {
    switch (status) {
      case 'checking':
        return <Loader2 className="h-5 w-5 animate-spin" />;
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <XCircle className="h-5 w-5 text-amber-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Supabase Health {icon()}</CardTitle>
          <CardDescription>Environment & connectivity diagnostics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'checking' && <p className="text-muted-foreground">Running checks...</p>}
          {details && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p className="font-medium">Project URL</p>
                <p className="truncate" title={details.url}>{details.url || '—'}</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium">API Key</p>
                <p>{details.hasKey ? 'Present' : 'Missing'}</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium">Profiles Query</p>
                <p>{details.canQueryProfiles ? 'OK' : 'Failed'}</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium">Session</p>
                <p>{details.sessionStatus}</p>
              </div>
              <div className="space-y-1 col-span-2">
                <p className="font-medium">Current User</p>
                <p>{details.currentUser}</p>
              </div>
              {details.profilesLatencyMs !== undefined && (
                <div className="space-y-1">
                  <p className="font-medium">Profiles Latency</p>
                  <p>{details.profilesLatencyMs} ms</p>
                </div>
              )}
              {details.sessionLatencyMs !== undefined && (
                <div className="space-y-1">
                  <p className="font-medium">Session Latency</p>
                  <p>{details.sessionLatencyMs} ms</p>
                </div>
              )}
            </div>
          )}
          {error && (
            <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={runCheck} disabled={status === 'checking'}>
              {status === 'checking' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span className="ml-2">Re-run</span>
            </Button>
          </div>
          <div className="text-xs text-muted-foreground space-y-1 mt-4">
            <p>Healthy: URL + Key present and profiles table query succeeds.</p>
            <p>Degraded: Auth loaded but table query failed (schema/RLS issue).</p>
            <p>Error: Missing config or network/auth failure.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupabaseHealth;