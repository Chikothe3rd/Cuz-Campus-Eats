import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { checkSupabaseSetup } from '@/lib/setupChecker';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

const SetupDiagnostics = () => {
  const [checking, setChecking] = useState(true);
  const [result, setResult] = useState<Awaited<ReturnType<typeof checkSupabaseSetup>> | null>(null);

  const runCheck = async () => {
    setChecking(true);
    const status = await checkSupabaseSetup();
    setResult(status);
    setChecking(false);
  };

  useEffect(() => {
    runCheck();
  }, []);

  const getStatusIcon = (isOk: boolean) => {
    if (checking) return null;
    return isOk ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Supabase Setup Diagnostics
            {!checking && result && (
              result.isConfigured && result.isReachable && result.canQuery ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : (
                <XCircle className="h-6 w-6 text-red-500" />
              )
            )}
          </CardTitle>
          <CardDescription>
            Comprehensive check of your Supabase configuration and connectivity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {checking && (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Running diagnostics...</p>
            </div>
          )}

          {!checking && result && (
            <>
              {/* Status Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-2 p-3 rounded-lg border bg-card">
                  {getStatusIcon(result.isConfigured)}
                  <div>
                    <p className="text-sm font-medium">Configuration</p>
                    <p className="text-xs text-muted-foreground">
                      {result.isConfigured ? 'Complete' : 'Missing'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg border bg-card">
                  {getStatusIcon(result.isReachable)}
                  <div>
                    <p className="text-sm font-medium">Reachability</p>
                    <p className="text-xs text-muted-foreground">
                      {result.isReachable ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg border bg-card">
                  {getStatusIcon(result.canQuery)}
                  <div>
                    <p className="text-sm font-medium">Database</p>
                    <p className="text-xs text-muted-foreground">
                      {result.canQuery ? 'Accessible' : 'Not Accessible'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Environment Variables */}
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  Environment Variables
                </h3>
                <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-2">
                  <div>
                    <span className="text-muted-foreground">VITE_SUPABASE_URL:</span>{' '}
                    <span className={import.meta.env.VITE_SUPABASE_URL ? 'text-green-600' : 'text-red-600'}>
                      {import.meta.env.VITE_SUPABASE_URL || '❌ NOT SET'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">VITE_SUPABASE_PUBLISHABLE_KEY:</span>{' '}
                    <span className={import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY ? 'text-green-600' : 'text-red-600'}>
                      {(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY) ? '✅ SET (hidden)' : '❌ NOT SET'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">VITE_GOOGLE_MAPS_API_KEY:</span>{' '}
                    <span className={import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? 'text-green-600' : 'text-amber-600'}>
                      {import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? '✅ SET (hidden)' : '⚠️ NOT SET (optional)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Issues */}
              {result.issues.length > 0 && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-semibold mb-2">Issues Found:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {result.issues.map((issue, i) => (
                        <li key={i} className="text-sm">{issue}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Recommendations */}
              {result.recommendations.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-semibold mb-2">Recommended Actions:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      {result.recommendations.map((rec, i) => (
                        <li key={i} className="text-sm">{rec}</li>
                      ))}
                    </ol>
                  </AlertDescription>
                </Alert>
              )}

              {/* Success Message */}
              {result.isConfigured && result.isReachable && result.canQuery && (
                <Alert className="border-green-500 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <p className="font-semibold">✅ All systems operational!</p>
                    <p className="text-sm mt-1">
                      Supabase is properly configured and accessible. You can now use the login and other features.
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              {/* Setup Guide Link */}
              {(!result.isConfigured || !result.isReachable) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900 mb-2">
                    <strong>Need help?</strong> Follow the detailed setup guide:
                  </p>
                  <code className="text-xs bg-white px-2 py-1 rounded">
                    SUPABASE_SETUP_REQUIRED.md
                  </code>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button onClick={runCheck} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Re-run Diagnostics
                </Button>
                <Button onClick={() => window.location.href = '/login'} disabled={!result.canQuery}>
                  Go to Login
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SetupDiagnostics;
