import { useNavigate } from "react-router-dom";
import { Plus, Monitor, Smartphone, Cpu, Upload, FileText } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import InterviewCard from "@/components/InterviewCard";
import RoleCard from "@/components/RoleCard";
import { Button } from "@/components/ui/button";
import aiInterviewer from "@/assets/ai-interviewer.jpg";

const Dashboard = () => {
  const navigate = useNavigate();

  const interviews = [
    {
      title: "Full Stack Interview",
      date: "Mar 19, 2025",
      score: 15,
      type: "MIXED" as const,
      description: "View your detailed feedback from this interview.",
      status: "completed" as const,
    },
    {
      title: "Front End Interview",
      date: "Mar 17, 2025",
      score: null,
      type: "MIXED" as const,
      description: "Continue your interview session.",
      status: "in-progress" as const,
    },
  ];

  const roles = [
    { icon: Monitor, title: "Front End Interview", technologies: "React, Tailwind, System Design" },
    { icon: Smartphone, title: "Mobile Developer", technologies: "React Native, Flutter, Swift" },
    { icon: Cpu, title: "Backend Engineer", technologies: "Node.js, Python, PostgreSQL" },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar variant="user" />
      
      <main className="flex-1 p-8 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Welcome back, Adrian! 👋</h1>
            <p className="text-muted-foreground mt-1">Ready to ace your next big interview?</p>
          </div>
          <Button 
            className="gradient-primary text-primary-foreground"
            onClick={() => navigate("/interview")}
          >
            <Plus size={18} className="mr-2" />
            Create New Interview
          </Button>
        </div>

        {/* Hero Card */}
        <div className="rounded-2xl overflow-hidden mb-10 relative" 
             style={{ 
               background: 'linear-gradient(135deg, hsl(265 84% 40%) 0%, hsl(228 25% 12%) 60%)' 
             }}>
          <div className="flex flex-col lg:flex-row items-center p-8 lg:p-12">
            <div className="flex-1 space-y-6 z-10">
              {/* Floating badges */}
              <div className="flex gap-3 mb-4">
                <span className="px-3 py-1 bg-secondary/50 border border-border rounded-full text-sm text-foreground">
                  {"<HTML/>"}
                </span>
              </div>
              
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground leading-tight">
                Get Interview-Ready with AI-Powered Practice & Feedback
              </h2>
              <p className="text-muted-foreground text-lg max-w-md">
                Practice real interview questions and get instant feedback with our advanced AI interviewer.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button 
                  className="gradient-primary text-primary-foreground px-8 h-12"
                  onClick={() => navigate("/interview")}
                >
                  Start an Interview
                </Button>
                <Button 
                  variant="outline"
                  className="px-8 h-12"
                  onClick={() => navigate("/upload-resume")}
                >
                  <Upload size={18} className="mr-2" />
                  Upload Your Resume
                </Button>
                <Button 
                  variant="outline"
                  className="px-8 h-12"
                  onClick={() => navigate("/add-details")}
                >
                  <FileText size={18} className="mr-2" />
                  Add Details
                </Button>
              </div>
            </div>
            
            <div className="relative mt-8 lg:mt-0 lg:ml-8">
              {/* Floating code badges */}
              <span className="absolute -top-2 -right-2 px-3 py-1 bg-primary/30 border border-primary/50 rounded-lg text-sm text-primary font-mono z-20">
                {"{ JS }"}
              </span>
              
              <div className="relative">
                <div className="w-64 h-80 lg:w-80 lg:h-96 rounded-2xl overflow-hidden border-4 border-secondary/50">
                  <img 
                    src={aiInterviewer} 
                    alt="AI Interviewer" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Your Interviews */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-semibold text-foreground">Your Interviews</h3>
              <span className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-xs text-muted-foreground">
                {interviews.length}
              </span>
            </div>
            <button className="text-primary text-sm font-medium hover:underline">
              View All
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {interviews.map((interview, index) => (
              <InterviewCard key={index} {...interview} />
            ))}
          </div>
        </section>

        {/* Available Roles */}
        <section>
          <h3 className="text-xl font-semibold text-foreground mb-6">Available Roles</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {roles.map((role, index) => (
              <RoleCard key={index} {...role} />
            ))}
         <div onClick={() => navigate("/add-details")}>
  <RoleCard
    icon={Plus}
    title="Custom Role"
    isCustom
  />
</div>

          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
