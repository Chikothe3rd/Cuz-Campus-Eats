import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingBag, Store, Bike, Utensils, Clock, Shield, AlertTriangle } from 'lucide-react';
import { userStorage } from '@/lib/storage';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Landing = () => {
  const navigate = useNavigate();
  const [showSetupWarning, setShowSetupWarning] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const currentUser = userStorage.getCurrentUser();
    if (currentUser) {
      navigate(`/${currentUser.role}`);
    }

    // Check if Supabase is configured
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      setShowSetupWarning(true);
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Setup Warning Banner */}
      {showSetupWarning && (
        <div className="bg-red-500 text-white py-3 px-4 text-center">
          <div className="container mx-auto flex items-center justify-center gap-3 flex-wrap">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">Supabase is not configured</span>
            <Button 
              size="sm" 
              variant="secondary"
              onClick={() => navigate('/setup')}
              className="ml-2"
            >
              Run Setup Diagnostics
            </Button>
          </div>
        </div>
      )}
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-background -z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent -z-10" />
        
        <div className="container px-4 pt-24 pb-20 sm:pt-32 sm:pb-28">
          <div className="mx-auto max-w-4xl text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-6xl font-bold tracking-tight sm:text-7xl md:text-8xl">
                <span className="block bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  Campus Eats
                </span>
              </h1>
              <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Order from student vendors. Get delivered by students. All on campus.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button
                size="lg"
                onClick={() => navigate('/login')}
                className="text-lg h-14 px-10 shadow-lg hover:shadow-xl transition-all"
              >
                <ShoppingBag className="mr-2 h-5 w-5" />
                Get Started
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/register')}
                className="text-lg h-14 px-10 border-2"
              >
                Create Account
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="pt-12 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="space-y-1">
                <p className="text-3xl font-bold text-primary">100+</p>
                <p className="text-sm text-muted-foreground">Active Students</p>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-accent">15+</p>
                <p className="text-sm text-muted-foreground">Food Vendors</p>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-success">24/7</p>
                <p className="text-sm text-muted-foreground">Delivery</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container px-4 py-20">
        <div className="text-center mb-16 space-y-3">
          <h2 className="text-4xl font-bold">How It Works</h2>
          <p className="text-muted-foreground text-lg">Choose your role in the campus food ecosystem</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50">
            <CardHeader className="space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShoppingBag className="h-8 w-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl">Order Food</CardTitle>
              <CardDescription className="text-base">
                Browse menus from student vendors and the official cafeteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">✓</span>
                  <span>Browse multiple vendors</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">✓</span>
                  <span>Real-time order tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">✓</span>
                  <span>Instant notifications</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-accent/50">
            <CardHeader className="space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center group-hover:scale-110 transition-transform">
                <Store className="h-8 w-8 text-accent-foreground" />
              </div>
              <CardTitle className="text-2xl">Sell Your Food</CardTitle>
              <CardDescription className="text-base">
                Become a student vendor and earn money with your cooking skills
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-accent font-bold">✓</span>
                  <span>Create your menu</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent font-bold">✓</span>
                  <span>Manage orders easily</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent font-bold">✓</span>
                  <span>Set your own prices</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-success/50">
            <CardHeader className="space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-success to-success flex items-center justify-center group-hover:scale-110 transition-transform">
                <Bike className="h-8 w-8 text-success-foreground" />
              </div>
              <CardTitle className="text-2xl">Deliver & Earn</CardTitle>
              <CardDescription className="text-base">
                Make money by delivering food orders around campus
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-success font-bold">✓</span>
                  <span>Flexible schedule</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success font-bold">✓</span>
                  <span>On-demand deliveries</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success font-bold">✓</span>
                  <span>Earn per delivery</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-muted/30 py-20">
        <div className="container px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 space-y-3">
              <h2 className="text-4xl font-bold">Why Campus Eats?</h2>
              <p className="text-muted-foreground text-lg">Built by students, for students</p>
            </div>

            <div className="grid md:grid-cols-3 gap-12">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <Utensils className="h-10 w-10 text-primary" />
                </div>
                <h3 className="font-bold text-xl">Student-Friendly</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Affordable prices and portions designed for student budgets
                </p>
              </div>

              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center">
                  <Clock className="h-10 w-10 text-accent" />
                </div>
                <h3 className="font-bold text-xl">Fast Delivery</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Quick on-campus delivery by students who know all the shortcuts
                </p>
              </div>

              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-success/20 to-success/10 flex items-center justify-center">
                  <Shield className="h-10 w-10 text-success" />
                </div>
                <h3 className="font-bold text-xl">Safe & Secure</h3>
                <p className="text-muted-foreground leading-relaxed">
                  All vendors and runners are verified university students
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container px-4 py-24 text-center">
        <div className="mx-auto max-w-3xl space-y-8">
          <h2 className="text-5xl font-bold">Ready to Get Started?</h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Join hundreds of students already using Campus Eats
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Button
              size="lg"
              onClick={() => navigate('/register')}
              className="text-lg h-14 px-10 shadow-lg hover:shadow-xl transition-all"
            >
              Sign Up Now
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/login')}
              className="text-lg h-14 px-10 border-2"
            >
              I Have an Account
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container px-4 py-8">
          <div className="text-center space-y-2">
            <p className="font-semibold">Campus Eats © 2025</p>
            <p className="text-sm text-muted-foreground">University Food Ordering System</p>
            <p className="text-xs text-muted-foreground">Demo App - All data stored locally in your browser</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
