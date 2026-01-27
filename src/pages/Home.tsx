import { useNavigate } from "react-router-dom";
import { 
  Play, 
  RefreshCw, 
  Mic, 
  BarChart3,
  Calendar,
  Star,
  Monitor,
  Smartphone,
  Cpu,
  Sun
} from "lucide-react";
import PrepWiseLogo from "@/components/PrepWiseLogo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const Home = () => {
  const navigate = useNavigate();

  const interviewCards = [
    {
      icon: Monitor,
      title: "Full Stack Interview",
      date: "Mar 19, 2025",
      score: null,
      type: "MIXED",
      description: "You haven't taken this interview yet. Take it now to improve your skills."
    },
    {
      icon: Cpu,
      title: "Front End Development",
      date: "Mar 18, 2025",
      score: null,
      type: "MIXED",
      description: "Focuses on React, modern CSS, and performance optimization techniques."
    },
    {
      icon: Smartphone,
      title: "Mobile Developer",
      date: "Mar 17, 2025",
      score: null,
      type: "BEHAVIORAL",
      description: "Practice common behavioral questions and mobile-specific technical scenarios."
    }
  ];

  const features = [
    {
      icon: RefreshCw,
      title: "Real-time Feedback",
      description: "Instant evaluation of your answers with detailed improvement suggestions."
    },
    {
      icon: Mic,
      title: "Voice Interviewing",
      description: "Simulate real pressure with natural language voice-first conversations."
    },
    {
      icon: BarChart3,
      title: "Skills Breakdown",
      description: "Comprehensive score breakdown by communication, logic, and tech knowledge."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <PrepWiseLogo size="sm" />
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
          <a href="#interviews" className="text-muted-foreground hover:text-foreground transition-colors">Interviews</a>
          {/* <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a> */}
        </nav>
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/login")}>
            Sign In
          </Button>
          <Button className="gradient-primary text-primary-foreground" onClick={() => navigate("/login")}>
            Get Started
          </Button>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="rounded-3xl mx-6 mt-6 p-12 lg:p-16 relative"
               style={{ 
                 background: 'linear-gradient(135deg, hsl(228 25% 14%) 0%, hsl(228 25% 10%) 100%)' 
               }}>
            {/* Floating badges */}
            <div className="absolute top-8 right-1/3 hidden lg:block">
              <span className="px-3 py-1 bg-secondary/50 border border-border rounded-lg text-sm text-foreground flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-yellow-500" />
                JavaScript
              </span>
            </div>
            
            <div className="max-w-2xl">
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-6">
                Get Interview-Ready with AI-Powered Practice & Feedback
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-lg">
                Practice real interview questions with our voice-first AI interviewer and get instant, detailed feedback to land your dream job.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Button 
                  size="lg" 
                  className="gradient-primary text-primary-foreground h-12 px-8"
                  onClick={() => navigate("/login")}
                >
                  Start an Interview
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-border h-12 px-8"
                >
                  <Play size={18} className="mr-2" />
                  See how it works
                </Button>
              </div>
            </div>

            {/* Hero illustration area */}
            <div className="absolute right-12 top-1/2 -translate-y-1/2 hidden xl:block">
              <div className="relative">
                <div className="w-48 h-48 rounded-2xl bg-secondary/50 border border-border flex items-center justify-center">
                  <div className="h-16 w-16 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Mic className="text-primary" size={32} />
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 px-3 py-1 bg-secondary border border-border rounded-lg text-xs text-muted-foreground">
                  React.js
                </div>
                <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-xl bg-success/20 border border-success/30 flex items-center justify-center">
                  <span className="text-success text-2xl">✓</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Your Interviews */}
        <section className="px-6 py-12" id="interviews">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold text-foreground">Your Interviews</h2>
            <button className="text-primary text-sm font-medium hover:underline">View History</button>
          </div>
          <p className="text-muted-foreground text-sm mb-6">
            You haven't taken any interviews yet. Start your first session below.
          </p>

          <h3 className="text-lg font-semibold text-foreground mb-4">Take Interviews</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {interviewCards.map((card, index) => (
              <div 
                key={index}
                className="gradient-card border border-border rounded-xl p-5 hover:border-primary/40 transition-all cursor-pointer group"
                onClick={() => navigate("/login")}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-lg bg-secondary border border-border flex items-center justify-center group-hover:border-primary/40 transition-colors">
                    <card.icon className="text-primary" size={22} />
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                    card.type === "BEHAVIORAL" 
                      ? "bg-success/20 text-success"
                      : "bg-warning/20 text-warning"
                  }`}>
                    {card.type}
                  </span>
                </div>
                <h4 className="font-semibold text-foreground mb-2">{card.title}</h4>
                <div className="flex items-center gap-4 text-muted-foreground text-sm mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    <span>{card.date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star size={14} />
                    <span>---/100</span>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm">{card.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="px-6 py-12" id="features">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="h-14 w-14 rounded-xl bg-secondary border border-border flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="text-muted-foreground" size={24} />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Theme Toggle */}
        <div className="fixed bottom-6 right-6">
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-full border-border">
            <Sun size={20} />
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8 mt-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <PrepWiseLogo size="sm" />
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </div>
          <span className="text-sm text-muted-foreground">© 2025 PrepWise AI. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
};

export default Home;
