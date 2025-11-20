import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle state passed from registration
  useEffect(() => {
    const state = location.state as { email?: string; message?: string } | null;
    if (state?.email) {
      setEmail(state.email);
    }
    if (state?.message) {
      toast.info(state.message);
      // Clear the state after showing the message
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await signIn(email, password);
      
      if (error) throw new Error(error);
      
      if (!data?.userId) {
        throw new Error('Login successful but no user data returned');
      }
      
      toast.success('Welcome back!');
      
      // Redirect based on user's role
      if (data.role) {
        // Small delay to ensure auth state is fully updated
        setTimeout(() => {
          navigate(`/${data.role}`, { replace: true });
        }, 100);
      } else {
        // User exists but has no role assigned - shouldn't happen but handle gracefully
        toast.info('Please complete your profile setup');
        setTimeout(() => {
          navigate('/register', { replace: true });
        }, 100);
      }
    } catch (error: unknown) {
      console.error('Login error:', error);
      // Map common network/misconfiguration issues to clearer messages
      const raw = error as { message?: string } | string | undefined;
      const msg = typeof raw === 'string' ? raw : String(raw?.message ?? raw);
      
      let message = msg || 'Sign-in failed. Please try again.';
      let showSetupLink = false;
      
      // Email not confirmed
      if (/Email not confirmed/i.test(msg) || /email.*verif/i.test(msg)) {
        message = 'Please verify your email address before signing in. Check your inbox for the verification link.';
      }
      // Network unreachable or DNS errors
      else if (/Failed to fetch/i.test(msg) || /TypeError: Failed to fetch/i.test(msg) || /NetworkError/i.test(msg)) {
        message = 'Unable to reach Supabase. The project may not exist or has been deleted.';
        showSetupLink = true;
      }
      // Supabase config error messages propagated from client
      else if (/Supabase is not configured/i.test(msg) || /Missing.*environment/i.test(msg)) {
        message = 'Supabase is not configured. Setup is required.';
        showSetupLink = true;
      }
      // Invalid credentials
      else if (/Invalid login credentials/i.test(msg)) {
        message = 'Invalid email or password. Please try again.';
      }
      // DNS/ENOTFOUND errors
      else if (/ENOTFOUND/i.test(msg) || /DNS/i.test(msg) || /not reach/i.test(msg)) {
        message = 'Cannot reach Supabase server. The project may not exist.';
        showSetupLink = true;
      }
      
      toast.error(message, {
        duration: 5000,
        action: showSetupLink ? {
          label: 'Setup Guide',
          onClick: () => navigate('/setup'),
        } : undefined,
      });
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
