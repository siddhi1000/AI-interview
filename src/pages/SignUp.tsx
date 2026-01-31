import { SignUp } from "@clerk/clerk-react";
import { TrendingUp } from "lucide-react";
import officeHero from "@/assets/office-hero.jpg";

const SignUpPage = () => {
  return (
    <div className="min-h-screen flex">
      <div
        className="hidden lg:flex lg:flex-1 flex-col justify-between p-12 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, hsl(265 84% 50%) 0%, hsl(265 60% 30%) 30%, hsl(228 25% 8%) 70%)",
        }}
      >
        <div className="flex items-center gap-2 relative z-10">
          <TrendingUp className="h-6 w-6 text-primary-foreground" />
          <span className="text-xl font-bold text-primary-foreground">PrepWise</span>
        </div>

        <div className="relative z-10 space-y-8">
          <div className="rounded-2xl overflow-hidden shadow-2xl max-w-md">
            <img src={officeHero} alt="Modern workspace" className="w-full h-64 object-cover" />
          </div>

          <div className="space-y-4 max-w-lg">
            <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground leading-tight">
              Create your PrepWise account.
            </h1>
            <p className="text-lg text-primary-foreground/80">
              Start practicing interviews with secure authentication powered by Clerk.
            </p>
          </div>
        </div>

        <div></div>
      </div>

      <div className="flex-1 lg:max-w-xl flex items-center justify-center p-8 bg-card">
        <SignUp
          path="/sign-up"
          routing="path"
          signInUrl="/login"
          afterSignUpUrl="/dashboard"
        />
      </div>
    </div>
  );
};

export default SignUpPage;

