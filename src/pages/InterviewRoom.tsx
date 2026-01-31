import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Video, 
  Mic, 
  Settings, 
  Phone, 
  AlignLeft,
  Volume2
} from "lucide-react";
import PrepWiseLogo from "@/components/PrepWiseLogo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import aiInterviewer from "@/assets/ai-interviewer.jpg";
import { useApi } from "@/lib/api";
import { toast } from "sonner";

const InterviewRoom = () => {
  const navigate = useNavigate();
  const api = useApi();
  const [timer, setTimer] = useState(522); // 8:42
  const [isListening, setIsListening] = useState(true);
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.createInterview({});
        const id = res?.interview?.id as string | undefined;
        if (!id) return;
        setInterviewId(id);
        await api.updateInterview(id, { status: "IN_PROGRESS", startedAt: new Date().toISOString() });
        try {
          setGenerating(true);
          const q = await api.generateInterviewQuestions(id, { questionCount: 8, difficultyTarget: "MEDIUM" });
          const qs = (q?.questions as any[]) ?? [];
          setQuestions(qs);
          setAnswers({});
        } catch (err: any) {
          toast.error(err.message || "Failed to generate questions.");
        } finally {
          setGenerating(false);
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to start interview session.");
      }
    })();
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const messages = [
    {
      role: "ai",
      time: "10:40 AM",
      content: "That's a great explanation of how React handles virtual DOM diffing. Now, could you walk me through how you would optimize a component that is re-rendering too frequently in a large-scale application?"
    },
    {
      role: "user",
      time: "10:41 AM",
      content: "Sure. To optimize that, I'd first start by profiling the app with the React DevTools to identify the exact cause. Usually, I'd look into using React.memo for functional components..."
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-4">
          <PrepWiseLogo size="sm" />
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
            <span className="text-sm text-muted-foreground">INTERVIEW IN PROGRESS:</span>
            <span className="text-sm font-medium text-foreground">Senior Frontend Role</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-secondary rounded-full text-foreground font-mono text-sm">
            {formatTime(timer)}
          </div>
          <Avatar className="h-10 w-10 border-2 border-success">
            <AvatarFallback className="bg-success text-success-foreground">L</AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex gap-6 p-6">
        {/* Video Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 bg-card rounded-2xl border border-border overflow-hidden relative flex items-center justify-center">
            {/* AI Interviewer Display */}
            <div className="text-center">
              <div className="w-64 h-64 rounded-full border-4 border-secondary overflow-hidden mx-auto mb-6 relative">
                <div className="absolute inset-0 rounded-full border-4 border-primary/30 animate-pulse" />
                <img 
                  src={aiInterviewer} 
                  alt="AI Interviewer" 
                  className="w-full h-full object-cover"
                />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">AI Interviewer</h2>
              <div className="flex items-center justify-center gap-2 text-primary">
                <Volume2 size={18} className="animate-pulse" />
                <span className="text-sm uppercase tracking-wider">
                  {isListening ? "Listening..." : "Speaking..."}
                </span>
              </div>
            </div>

            {/* User Video Thumbnail */}
            <div className="absolute bottom-6 left-6 w-40 h-28 bg-secondary rounded-xl border border-border overflow-hidden">
              <div className="w-full h-full flex items-center justify-center bg-secondary">
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Video className="text-primary" size={24} />
                </div>
              </div>
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-background/80 rounded text-xs text-foreground">
                You (Adrian)
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Input Volume</div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div 
                    key={i} 
                    className={`w-1 rounded-full ${i <= 3 ? "bg-primary" : "bg-secondary"}`}
                    style={{ height: `${8 + i * 4}px` }}
                  />
                ))}
              </div>
              <span className="text-success text-sm">Noise reduction Active</span>
            </div>

            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" className="h-12 w-12 rounded-full border-border">
                <Video size={20} />
              </Button>
              <Button variant="outline" size="icon" className="h-12 w-12 rounded-full border-border">
                <Mic size={20} />
              </Button>
              <Button variant="outline" size="icon" className="h-12 w-12 rounded-full border-border">
                <Settings size={20} />
              </Button>
              <div className="w-px h-8 bg-border mx-2" />
              <Button 
                className="h-12 px-8 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={async () => {
                  try {
                    if (interviewId) {
                      await api.updateInterview(interviewId, { status: "COMPLETED", endedAt: new Date().toISOString() });
                    }
                  } catch {
                  } finally {
                    navigate(`/feedback?interviewId=${encodeURIComponent(interviewId ?? "")}`);
                  }
                }}
              >
                <Phone size={18} className="mr-2 rotate-[135deg]" />
                End Interview
              </Button>
            </div>

            <button className="text-muted-foreground text-sm hover:text-foreground flex items-center gap-2">
              <span className="text-lg">?</span>
              Technical difficulties?
            </button>
          </div>
        </div>

        {/* Transcription Panel */}
        <div className="w-96 bg-card rounded-2xl border border-border flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlignLeft size={18} className="text-muted-foreground" />
              <span className="font-semibold text-foreground">Interview Questions</span>
            </div>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              {generating ? "Generating" : questions.length ? `${questions.length} Loaded` : "Ready"}
            </span>
          </div>

          <div className="flex-1 p-4 space-y-6 overflow-auto">
            {questions.length === 0 ? (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  {generating ? "Generating interview questions..." : "No questions yet. Generate a question set to begin."}
                </div>
                <Button
                  className="w-full gradient-primary text-primary-foreground"
                  disabled={!interviewId || generating}
                  onClick={async () => {
                    if (!interviewId) return;
                    setGenerating(true);
                    try {
                      const q = await api.generateInterviewQuestions(interviewId, { questionCount: 8, difficultyTarget: "MEDIUM" });
                      const qs = (q?.questions as any[]) ?? [];
                      setQuestions(qs);
                      setAnswers({});
                    } catch (err: any) {
                      toast.error(err.message || "Failed to generate questions.");
                    } finally {
                      setGenerating(false);
                    }
                  }}
                >
                  {generating ? "Generating..." : "Generate Questions"}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {questions.map((q) => (
                  <div key={q.id} className="space-y-2">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">
                      Q{q.order} • {q.type} • {q.difficulty}
                    </div>
                    <div className="p-4 rounded-xl bg-secondary text-foreground">
                      <p className="text-sm leading-relaxed">{q.question}</p>
                    </div>
                    <textarea
                      className="w-full min-h-[96px] rounded-xl bg-background border border-border p-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Type your answer..."
                      value={answers[q.id] ?? ""}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                    />
                  </div>
                ))}

                <Button
                  className="w-full gradient-primary text-primary-foreground"
                  disabled={!interviewId || submitting}
                  onClick={async () => {
                    if (!interviewId) return;
                    setSubmitting(true);
                    try {
                      const payload = {
                        answers: questions.map((q) => ({ questionId: q.id, answerText: (answers[q.id] ?? "").trim() })),
                      };
                      const missing = payload.answers.find((a) => !a.answerText);
                      if (missing) {
                        toast.error("Please answer all questions before submitting.");
                        return;
                      }
                      await api.submitInterviewAnswers(interviewId, payload);
                      await api.generateInterviewAssessment(interviewId);
                      toast.success("Assessment generated.");
                      navigate(`/feedback?interviewId=${encodeURIComponent(interviewId)}`);
                    } catch (err: any) {
                      toast.error(err.message || "Failed to generate assessment.");
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                >
                  {submitting ? "Submitting..." : "Submit Answers & Generate Feedback"}
                </Button>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border">
            <p className="text-center text-muted-foreground text-sm">
              Questions are generated from your resume and saved profile.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewRoom;
