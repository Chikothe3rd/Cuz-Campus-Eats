import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { ArrowLeft, ShoppingBag, Store, Bike } from 'lucide-react';
import { mapAuthError } from '@/lib/utils';
import { signUpWithProfileAndRole, signIn } from '@/services/auth';
import { withRetry } from '@/lib/retry';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'buyer' | 'vendor' | 'runner';

const Register = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [campusName, setCampusName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('buyer');
  const [loading, setLoading] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [existingUser, setExistingUser] = useState<{ name: string } | null>(null);
  const [progressMessage, setProgressMessage] = useState('');
  const dashboardByRole: Record<UserRole, string> = {
    buyer: '/buyer',
    vendor: '/vendor',
    runner: '/runner',
  };

  // Check if email exists when user types
  useEffect(() => {
    const checkEmail = async () => {
      if (!email || !email.includes('@')) {
        setExistingUser(null);
        return;
      }

      setCheckingEmail(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('name')
          .eq('email', email.toLowerCase())
          .maybeSingle();

        if (data) {
          setExistingUser(data);
        } else {
          setExistingUser(null);
        }
      } catch (error) {
        console.error('Error checking email:', error);
      } finally {
        setCheckingEmail(false);
      }
    };

    const timeoutId = setTimeout(checkEmail, 500);
    return () => clearTimeout(timeoutId);
  }, [email]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (existingUser) {
      toast.error('An account with this email already exists. Please sign in instead.');
      return;
    }

  setLoading(true);
  setProgressMessage('Creating auth account...');

    try {
      // Sign up with Supabase Auth
      const result = await signUpWithProfileAndRole({
        email,
        password,
        name,
        phone,
        campusName,
        role,
        onProgress: (stage) => setProgressMessage(stage + '...'),
      });
      if (result.error) throw new Error(result.error);
      toast.success(`Welcome to Campus Eats, ${name}!`);

      // Ensure the user is signed in immediately after registration when possible
      const signin = await signIn(email, password);
      if (signin.error) {
        const msg = signin.error.toLowerCase();
        if (msg.includes('confirm') || msg.includes('email not confirmed') || msg.includes('verification')) {
          toast.info('Check your email to verify your account, then sign in.');
          navigate('/login');
        } else {
          toast.error(signin.error);
        }
        return;
      }

      const resolvedRole = (signin.data?.role ?? role) as UserRole | undefined;
      const destination = resolvedRole ? dashboardByRole[resolvedRole] : undefined;

      if (destination) {
        navigate(destination);
      } else {
        // Fallback path keeps user from getting stuck if role lookup fails
        toast.info('Account created. Please sign in to choose your dashboard.');
        navigate('/login');
      }
    } catch (error: unknown) {
      console.error('Registration error:', error);
      toast.error(mapAuthError(error));
    } finally {
      setLoading(false);
      setProgressMessage('');
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
            <CardTitle>Create Account</CardTitle>
            <CardDescription>
              Join Campus Eats and start ordering, selling, or delivering food
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleRegister}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">University Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                {checkingEmail && (
                  <p className="text-xs text-muted-foreground">Checking email...</p>
                )}
                {existingUser && (
                  <div className="bg-warning/10 border border-warning rounded-lg p-3 mt-2">
                    <p className="text-sm font-medium text-warning-foreground">
                      Account exists: Continue as {existingUser.name}
                    </p>
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto p-0 text-warning hover:text-warning/80"
                      onClick={() => navigate('/login')}
                    >
                      Sign in instead →
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="campusName">Campus Name</Label>
                <Input
                  id="campusName"
                  placeholder="e.g., Harvard University"
                  value={campusName}
                  onChange={(e) => setCampusName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="555-0100"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <Label>I want to...</Label>
                <RadioGroup value={role} onValueChange={(value) => setRole(value as UserRole)}>
                  <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent/5 cursor-pointer">
                    <RadioGroupItem value="buyer" id="buyer" />
                    <Label htmlFor="buyer" className="flex items-center gap-2 cursor-pointer flex-1">
                      <ShoppingBag className="h-4 w-4 text-primary" />
                      <div>
                        <p className="font-medium">Order Food</p>
                        <p className="text-xs text-muted-foreground">Browse and order from vendors</p>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent/5 cursor-pointer">
                    <RadioGroupItem value="vendor" id="vendor" />
                    <Label htmlFor="vendor" className="flex items-center gap-2 cursor-pointer flex-1">
                      <Store className="h-4 w-4 text-accent" />
                      <div>
                        <p className="font-medium">Sell Food</p>
                        <p className="text-xs text-muted-foreground">Become a student vendor</p>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-success/5 cursor-pointer">
                    <RadioGroupItem value="runner" id="runner" />
                    <Label htmlFor="runner" className="flex items-center gap-2 cursor-pointer flex-1">
                      <Bike className="h-4 w-4 text-success" />
                      <div>
                        <p className="font-medium">Deliver Food</p>
                        <p className="text-xs text-muted-foreground">Earn by delivering orders</p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <p className="text-xs text-muted-foreground">
                Password must be at least 6 characters long
              </p>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={loading || checkingEmail || !!existingUser}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                    {progressMessage || 'Creating account...'}
                  </span>
                ) : 'Create Account'}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-primary hover:underline"
                >
                  Sign in
                </button>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Register;
