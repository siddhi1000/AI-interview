import { SignIn } from "@clerk/clerk-react";
import { TrendingUp } from "lucide-react";
import { useLocation } from "react-router-dom";
import officeHero from "@/assets/office-hero.jpg";

const Login = () => {
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname ?? "/dashboard";

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
        <SignIn
          path="/login"
          routing="path"
          signUpUrl="/sign-up"
          afterSignInUrl={from}
        />
      </div>
    </div>
  );
};

export default Login;
