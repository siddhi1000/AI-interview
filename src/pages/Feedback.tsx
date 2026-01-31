import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  Sparkles, 
  MessageSquare, 
  Code, 
  Lightbulb, 
  Users,
  Calendar,
  Award,
  Sun
} from "lucide-react";
import PrepWiseLogo from "@/components/PrepWiseLogo";
import CategoryScoreCard from "@/components/CategoryScoreCard";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useApi } from "@/lib/api";
import { toast } from "sonner";

const Feedback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const api = useApi();
  const [searchParams] = useSearchParams();
  const interviewId = searchParams.get("interviewId") || "";
  const [loading, setLoading] = useState(false);
  const [interview, setInterview] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      if (!interviewId) return;
      setLoading(true);
      try {
        const res = await api.getInterview(interviewId);
        setInterview(res?.interview ?? null);
      } catch (err: any) {
        toast.error(err.message || "Failed to load feedback.");
      } finally {
        setLoading(false);
      }
    })();
  }, [interviewId]);

  const assessment = interview?.assessment ?? null;
  const rubric = assessment?.rubricScores ?? interview?.feedback?.categoryScores?.rubricScores ?? null;
  const strengths: string[] = assessment?.strengths ?? interview?.feedback?.categoryScores?.strengths ?? [];
  const improvements: string[] = assessment?.improvements ?? interview?.feedback?.categoryScores?.improvements ?? [];

  const overallScore = useMemo(() => {
    const score = assessment?.overallScore ?? interview?.feedback?.overallScore ?? 0;
    return typeof score === "number" ? score : 0;
  }, [assessment?.overallScore, interview?.feedback?.overallScore]);

  const categories = useMemo(() => {
    const s = strengths.slice(0, 3).join(" ");
    const i = improvements.slice(0, 3).join(" ");
    const base = (label: string) =>
      [s ? `Strengths: ${s}` : "", i ? `Areas to improve: ${i}` : ""].filter(Boolean).join(" ");

    const safe = (v: any) => (typeof v === "number" ? v : 0);

    return [
      {
        icon: MessageSquare,
        title: "Communication",
        score: safe(rubric?.communication),
        description: base("Communication"),
      },
      {
        icon: Code,
        title: "Technical Accuracy",
        score: safe(rubric?.technicalAccuracy),
        description: base("Technical Accuracy"),
      },
      {
        icon: Lightbulb,
        title: "Problem Solving",
        score: safe(rubric?.problemSolving),
        description: base("Problem Solving"),
      },
      {
        icon: Users,
        title: "Cultural Fit",
        score: safe(rubric?.culturalFit),
        description: base("Cultural Fit"),
      },
    ];
  }, [rubric, strengths, improvements]);

  const title = interview?.jobRole?.title ? `Feedback on the Interview - ${interview.jobRole.title}` : "Interview Feedback";
  const summary = assessment?.summary ?? interview?.feedback?.notes ?? "";
  const interviewDate = interview?.endedAt ?? interview?.createdAt ?? null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <PrepWiseLogo size="sm" />
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon">
            <Sun size={20} className="text-muted-foreground" />
          </Button>
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/20 text-primary">AD</AvatarFallback>
          </Avatar>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-8">
        {/* Back Button */}
        <button 
          onClick={() => navigate(location.pathname.startsWith("/admin") ? "/admin/interviews" : "/dashboard")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft size={18} />
          <span className="text-sm">{location.pathname.startsWith("/admin") ? "Back to Interviews" : "Back to Dashboard"}</span>
        </button>

        {/* Title */}
        <h1 className="text-3xl font-bold text-foreground mb-6">
          {title}
        </h1>

        {/* Stats Row */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center gap-3 px-4 py-3 bg-card rounded-xl border border-border">
            <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Award className="text-primary" size={20} />
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase">Overall Impression</div>
              <div className="text-xl font-bold text-foreground">
                {overallScore}
                <span className="text-muted-foreground font-normal text-sm">/100</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-3 bg-card rounded-xl border border-border">
            <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
              <Calendar className="text-muted-foreground" size={20} />
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase">Interview Date</div>
              <div className="text-lg font-semibold text-foreground">
                {interviewDate ? new Date(interviewDate).toLocaleDateString() : "—"}
              </div>
            </div>
          </div>

          <div className="flex-1" />

          <Button variant="outline" className="border-border">
            <Download size={18} className="mr-2" />
            Download PDF
          </Button>
          <Button className="gradient-primary text-primary-foreground">
            <Share2 size={18} className="mr-2" />
            Share Report
          </Button>
        </div>

        {/* AI Summary */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8 relative overflow-hidden">
          <div className="flex items-start gap-3 relative z-10">
            <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
              <Sparkles className="text-primary-foreground" size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">AI Performance Summary</h3>
              <p className="text-muted-foreground leading-relaxed">{loading ? "Loading..." : summary || "No summary available yet."}</p>
            </div>
          </div>
          {/* Decorative Sparkles */}
          <div className="absolute top-4 right-4">
            <Sparkles className="text-primary/20" size={40} />
          </div>
        </div>

        {/* Breakdown */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Breakdown of the Interview</h2>
            <span className="text-sm text-primary">{categories.length} Categories Evaluated</span>
          </div>

          <div className="space-y-4">
            {categories.map((category, index) => (
              <CategoryScoreCard 
                key={index}
                icon={category.icon}
                title={category.title}
                score={category.score}
                description={category.description}
                index={index + 1}
              />
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="mt-12 text-center py-8 border-t border-border">
          <h3 className="text-lg font-semibold text-foreground mb-2">Ready to improve?</h3>
          <p className="text-muted-foreground mb-6">
            Schedule another mock interview focusing on System Design to boost your score.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button 
              className="gradient-primary text-primary-foreground px-8"
              onClick={() => navigate("/interview")}
            >
              Start New Interview
            </Button>
            <Button 
              variant="outline" 
              className="border-border px-8"
              onClick={() => navigate("/dashboard")}
            >
              Return to Dashboard
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Feedback;
