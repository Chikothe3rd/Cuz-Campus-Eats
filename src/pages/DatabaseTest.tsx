import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const DatabaseTest = () => {
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking');
  const [error, setError] = useState<string>('');
  const [details, setDetails] = useState<Record<string, string | boolean> | null>(null);

  const testConnection = async () => {
    setStatus('checking');
    setError('');
    setDetails(null);
    const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    const envKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY) as
      | string
      | undefined;

    try {
      // Test 1: Check if Supabase env is configured
      console.log('Supabase URL:', envUrl);
      console.log('Supabase Key exists:', !!envKey);

      // Test 2: Try to fetch from a public table
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (fetchError) {
        throw new Error(`Database query failed: ${fetchError.message}`);
      }

      // Test 3: Check auth status
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw new Error(`Auth session check failed: ${sessionError.message}`);
      }

      setDetails({
        url: envUrl || 'Not configured',
        hasKey: !!envKey,
        canQueryDB: true,
        session: sessionData.session ? 'Active' : 'No active session',
        user: sessionData.session?.user?.email || 'Not logged in'
      });

      setStatus('success');
    } catch (err) {
      console.error('Connection test error:', err);
      setError(err instanceof Error ? err.message : String(err));
      setStatus('error');
      
      setDetails({
        url: envUrl || 'Not configured',
        hasKey: !!envKey,
        error: err instanceof Error ? err.message : String(err)
      });
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Database Connection Test
            {status === 'checking' && <Loader2 className="h-5 w-5 animate-spin" />}
            {status === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
            {status === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
          </CardTitle>
          <CardDescription>
            Testing Supabase connection and authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'checking' && (
            <p className="text-muted-foreground">Checking database connection...</p>
          )}

          {status === 'success' && (
            <div className="space-y-2">
              <p className="text-green-600 font-medium">✓ Connection successful!</p>
              <div className="bg-muted p-4 rounded-lg space-y-1 text-sm">
                <p><strong>Supabase URL:</strong> {details.url}</p>
                <p><strong>API Key:</strong> {details.hasKey ? '✓ Present' : '✗ Missing'}</p>
                <p><strong>Database Query:</strong> {details.canQueryDB ? '✓ Working' : '✗ Failed'}</p>
                <p><strong>Auth Session:</strong> {details.session}</p>
                <p><strong>Current User:</strong> {details.user}</p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-2">
              <p className="text-red-600 font-medium">✗ Connection failed</p>
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg space-y-2">
                <p className="font-medium">Error Details:</p>
                <p className="text-sm text-red-700">{error}</p>
                {details && (
                  <div className="mt-4 space-y-1 text-sm">
                    <p><strong>Supabase URL:</strong> {details.url || 'Not configured'}</p>
                    <p><strong>API Key:</strong> {details.hasKey ? '✓ Present' : '✗ Missing'}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <Button onClick={testConnection} disabled={status === 'checking'} className="w-full">
            {status === 'checking' ? 'Testing...' : 'Test Again'}
          </Button>

          <div className="text-xs text-muted-foreground">
            <p>Expected environment variables:</p>
            <ul className="list-disc list-inside mt-1">
              <li>VITE_SUPABASE_URL</li>
              <li>VITE_SUPABASE_PUBLISHABLE_KEY</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseTest;
