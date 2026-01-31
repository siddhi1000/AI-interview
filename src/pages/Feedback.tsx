import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  const api = useApi();
  const [searchParams] = useSearchParams();
  const [saved, setSaved] = useState(false);
  const interviewId = searchParams.get("interviewId") || "";

  const categories = [
    {
      icon: MessageSquare,
      title: "Communication Skills",
      score: 90,
      description: "Excellent verbal communication. The candidate explained their thought process clearly while live coding and responded thoughtfully to follow-up questions. They used precise terminology and structured their responses using the STAR method effectively."
    },
    {
      icon: Code,
      title: "Technical Knowledge",
      score: 82,
      description: "Demonstrated deep understanding of Next.js, React Server Components, and PostgreSQL optimization. Showed some hesitation when discussing Redis caching strategies, but quickly self-corrected when prompted about race conditions."
    },
    {
      icon: Lightbulb,
      title: "Problem Solving",
      score: 78,
      description: "Strong logical approach to the algorithm challenge. Handled the edge cases well after an initial hint. The solution was efficient (O(n log n)) and well-documented with comments during the implementation phase."
    },
    {
      icon: Users,
      title: "Cultural Fit",
      score: 95,
      description: "Shows high emotional intelligence and enthusiasm for the company mission. Asked insightful questions about the team's deployment workflow and mentorship culture, indicating a strong desire for long-term growth and collaboration."
    }
  ];

  const overallScore = useMemo(() => {
    const avg = Math.round(categories.reduce((sum, c) => sum + c.score, 0) / categories.length);
    return Number.isFinite(avg) ? avg : 0;
  }, [categories]);

  useEffect(() => {
    (async () => {
      if (!interviewId || saved) return;
      try {
        const categoryScores = categories.reduce((acc: any, c) => {
          acc[c.title] = { score: c.score, description: c.description };
          return acc;
        }, {});
        await api.upsertInterviewFeedback(interviewId, {
          overallScore,
          outcome: overallScore >= 80 ? "PASS" : overallScore >= 60 ? "PENDING" : "FAIL",
          notes: "Generated from UI feedback summary.",
          categoryScores,
        });
        setSaved(true);
      } catch (err: any) {
        toast.error(err.message || "Failed to save feedback.");
      }
    })();
  }, [interviewId, saved, overallScore]);

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
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft size={18} />
          <span className="text-sm">Back to Dashboard</span>
        </button>

        {/* Title */}
        <h1 className="text-3xl font-bold text-foreground mb-6">
          Feedback on the Interview - Full Stack Role
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
              <div className="text-lg font-semibold text-foreground">{new Date().toLocaleDateString()}</div>
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
              <p className="text-muted-foreground leading-relaxed">
                The candidate demonstrated strong proficiency in full-stack concepts, particularly in frontend architecture and database optimization. While technical knowledge was high, there is room for improvement in articulating complex system designs and handling edge-case behavioral questions. Overall, a very promising performance that aligns well with senior engineering expectations.
              </p>
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
