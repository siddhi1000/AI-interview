import { useNavigate } from "react-router-dom";
import { Plus, Monitor, Smartphone, Cpu, Upload, FileText } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import InterviewCard from "@/components/InterviewCard";
import RoleCard from "@/components/RoleCard";
import { Button } from "@/components/ui/button";
import aiInterviewer from "@/assets/ai-interviewer.jpg";
import { useMemo } from "react";
import { useApi } from "@/lib/api";
import { useUser } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";

const Dashboard = () => {
  const navigate = useNavigate();
  const api = useApi();
  const { user } = useUser();

  const fallbackInterviews = [
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

  const fallbackRoles = [
    { icon: Monitor, title: "Front End Interview", technologies: "React, Tailwind, System Design" },
    { icon: Smartphone, title: "Mobile Developer", technologies: "React Native, Flutter, Swift" },
    { icon: Cpu, title: "Backend Engineer", technologies: "Node.js, Python, PostgreSQL" },
  ];

  const interviewsQuery = useQuery({
    queryKey: ["interviews"],
    queryFn: async () => api.listInterviews(),
    staleTime: 15_000,
    retry: 1,
  });

  const rolesQuery = useQuery({
    queryKey: ["job-roles", { active: true }],
    queryFn: async () => api.listJobRoles({ active: true }),
    staleTime: 60_000,
    retry: 1,
  });

  const interviews = useMemo(() => {
    const remoteInterviews = (interviewsQuery.data?.interviews as any[] | undefined) ?? null;
    if (!remoteInterviews) return fallbackInterviews;
    return remoteInterviews.slice(0, 6).map((i) => {
      const status =
        i.status === "COMPLETED" ? "completed" : i.status === "IN_PROGRESS" ? "in-progress" : "pending";
      const date = new Date(i.scheduledAt ?? i.createdAt ?? Date.now()).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
      return {
        title: i.jobRole?.title ?? "Interview",
        date,
        score: i.feedback?.overallScore ?? null,
        type: "MIXED" as const,
        description: status === "completed" ? "View your detailed feedback from this interview." : "Continue your interview session.",
        status,
      };
    });
  }, [interviewsQuery.data]);

  const roles = useMemo(() => {
    const remoteRoles = (rolesQuery.data?.roles as any[] | undefined) ?? null;
    if (!remoteRoles) return fallbackRoles;
    return remoteRoles.slice(0, 6).map((r) => {
      const icon = (r.category ?? "").toLowerCase().includes("mobile")
        ? Smartphone
        : (r.category ?? "").toLowerCase().includes("backend")
          ? Cpu
          : Monitor;
      const technologies = Array.isArray(r.tags) ? r.tags.join(", ") : "";
      return { icon, title: r.title, technologies: technologies || r.category || "Interview role" };
    });
  }, [rolesQuery.data]);

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar variant="user" />
      
      <main className="flex-1 p-8 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Welcome back, {user?.firstName ?? "there"}!</h1>
            <p className="text-muted-foreground mt-1">Ready to ace your next big interview?</p>
          </div>
          <Button 
            className="gradient-primary text-primary-foreground"
            onClick={() => navigate("/add-details")}
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
                  onClick={() => navigate("/add-details")}
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
            <button className="text-primary text-sm font-medium hover:underline" onClick={() => navigate("/history")}>
              View All
            </button>
          </div>
          
          {interviewsQuery.isError ? (
            <div className="bg-card border border-border rounded-xl p-4 text-sm text-muted-foreground">
              Failed to load interviews. Showing sample data.
            </div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {interviewsQuery.isLoading
              ? Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="h-[168px] rounded-2xl bg-secondary/30 animate-pulse" />
                ))
              : interviews.map((interview, index) => <InterviewCard key={index} {...interview} />)}
          </div>
        </section>

        {/* Available Roles */}
        <section>
          <h3 className="text-xl font-semibold text-foreground mb-6">Available Roles</h3>
          {rolesQuery.isError ? (
            <div className="bg-card border border-border rounded-xl p-4 text-sm text-muted-foreground mb-6">
              Failed to load roles. Showing sample data.
            </div>
          ) : null}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {rolesQuery.isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-[160px] rounded-2xl bg-secondary/30 animate-pulse" />
                ))
              : roles.map((role, index) => <RoleCard key={index} {...role} />)}
            <div onClick={() => navigate("/add-details")}>
              <RoleCard icon={Plus} title="Custom Role" isCustom />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
