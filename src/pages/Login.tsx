import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { signIn } from '@/services/auth';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await signIn(email, password);
      if (error) throw new Error(error);
      toast.success('Welcome back!');
      if (data?.role) {
        navigate(`/${data.role}`);
      } else {
        toast.info('Please complete your registration');
        navigate('/register');
      }
    } catch (error: unknown) {
      console.error('Login error:', error);
      // Map common network/misconfiguration issues to clearer messages
      const message = (() => {
        const raw = error as { message?: string } | string | undefined;
        const msg = typeof raw === 'string' ? raw : String(raw?.message ?? raw);
        // Network unreachable or opened without dev server (envs missing)
        if (/Failed to fetch/i.test(msg) || /TypeError: Failed to fetch/i.test(msg)) {
          return 'Unable to reach the server. Check your internet connection and ensure the app is running via "npm run dev" (not opening index.html directly).';
        }
        // Supabase config error messages propagated from client
        if (/Supabase is not configured/i.test(msg) || /Missing Supabase environment variables/i.test(msg)) {
          return 'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env and run the app with "npm run dev".';
        }
        // Invalid credentials
        if (/Invalid login credentials/i.test(msg)) {
          return 'Invalid email or password. Please try again.';
        }
        return msg || 'Sign-in failed. Please try again.';
      })();
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Campus Eats
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="text-primary hover:underline"
                >
                  Register here
                </button>
              </p>
            </CardFooter>
          </form>
        </Card>

      </div>
    </div>
  );
};

export default Login;
