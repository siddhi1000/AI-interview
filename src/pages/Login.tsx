import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import officeHero from "@/assets/office-hero.jpg";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { UserRole } from "@/types/auth";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("candidate");
  const [adminSecret, setAdminSecret] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignup) {
        // Validation for Admin Signup
        if (role === 'admin' && adminSecret !== 'admin123') {
          toast.error("Invalid Admin Secret Key");
          setLoading(false);
          return;
        }

        // Sign Up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: role,
            }
          }
        });

        if (error) throw error;

        toast.success("Account created! Please check your email to confirm.");
        
        // If session exists immediately (email confirm off), redirect
        if (data.session) {
           navigate(role === 'admin' ? '/admin' : '/dashboard');
        }
      } else {
        // Sign In
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          // Check role to redirect correctly
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();
          
          const userRole = profile?.role as UserRole || 'candidate';
          
          // STRICT SECURITY: Prevent non-admins from accessing admin login flow if intended
          // (Though here we just redirect them to their dashboard)
          
          const from = (location.state as any)?.from?.pathname;
          if (from) {
            navigate(from);
          } else {
            navigate(userRole === 'admin' ? '/admin' : '/dashboard');
          }
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Hero */}
      <div className="hidden lg:flex lg:flex-1 flex-col justify-between p-12 relative overflow-hidden" 
           style={{ 
             background: 'linear-gradient(135deg, hsl(265 84% 50%) 0%, hsl(265 60% 30%) 30%, hsl(228 25% 8%) 70%)' 
           }}>
        <div className="flex items-center gap-2 relative z-10">
          <TrendingUp className="h-6 w-6 text-primary-foreground" />
          <span className="text-xl font-bold text-primary-foreground">PrepWise</span>
        </div>
        
        <div className="relative z-10 space-y-8">
          <div className="rounded-2xl overflow-hidden shadow-2xl max-w-md">
            <img 
              src={officeHero} 
              alt="Modern workspace" 
              className="w-full h-64 object-cover"
            />
          </div>
          
          <div className="space-y-4 max-w-lg">
            <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground leading-tight">
              Master your future. Join 10k+ professionals.
            </h1>
            <p className="text-lg text-primary-foreground/80">
              Access premium resources, mock interviews, and personalized career roadmaps designed to land you at top-tier tech companies.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex -space-x-3">
              <div className="h-10 w-10 rounded-full bg-cyan-500 border-2 border-background flex items-center justify-center text-xs font-medium text-white">JD</div>
              <div className="h-10 w-10 rounded-full bg-purple-500 border-2 border-background flex items-center justify-center text-xs font-medium text-white">MK</div>
              <div className="h-10 w-10 rounded-full bg-orange-500 border-2 border-background flex items-center justify-center text-xs font-medium text-white">SL</div>
            </div>
            <span className="text-primary-foreground/80 text-sm">Trusted by alumni at global tech leaders</span>
          </div>
        </div>
        
        <div></div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 lg:max-w-xl flex items-center justify-center p-8 bg-card">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-foreground">
              {isSignup ? "Create an Account" : "Welcome to PrepWise"}
            </h2>
            <p className="text-muted-foreground">
              {isSignup ? "Sign up to get started." : "Start your career journey with us today."}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-foreground">Password</Label>
                {!isSignup && (
                  <button type="button" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </button>
                )}
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-input border-border text-foreground"
                required
              />
            </div>

            {isSignup && (
              <div className="space-y-3">
                <Label className="text-foreground">I am a...</Label>
                <RadioGroup defaultValue="candidate" onValueChange={(v) => setRole(v as UserRole)} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="candidate" id="r1" />
                    <Label htmlFor="r1">Candidate</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="admin" id="r2" />
                    <Label htmlFor="r2">Admin</Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {isSignup && role === 'admin' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <Label htmlFor="adminSecret" className="text-foreground">Admin Secret Key</Label>
                <Input
                  id="adminSecret"
                  type="password"
                  placeholder="Enter secret key (admin123)"
                  value={adminSecret}
                  onChange={(e) => setAdminSecret(e.target.value)}
                  className="bg-input border-border text-foreground"
                />
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground h-12 text-base font-medium">
              {loading ? "Processing..." : (isSignup ? "Sign Up" : "Log In")}
            </Button>
          </form>

          <p className="text-center text-muted-foreground">
            {isSignup ? "Already have an account? " : "Don't have an account? "}
            <button 
              type="button"
              onClick={() => setIsSignup(!isSignup)}
              className="text-primary hover:underline font-medium"
            >
              {isSignup ? "Log in" : "Sign up"}
            </button>
          </p>

          <div className="flex items-center justify-center gap-6 pt-4 text-sm text-muted-foreground">
            <button className="hover:text-foreground transition-colors">Privacy Policy</button>
            <button className="hover:text-foreground transition-colors">Terms of Service</button>
            <button className="hover:text-foreground transition-colors">Contact Support</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
