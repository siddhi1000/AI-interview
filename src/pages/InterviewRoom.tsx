import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Video, 
  Mic, 
  MicOff,
  Settings, 
  Phone, 
  AlignLeft,
  Volume2,
  Play,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight
} from "lucide-react";
import PrepWiseLogo from "@/components/PrepWiseLogo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import aiInterviewer from "@/assets/ai-interviewer.jpg";
import { useApi } from "@/lib/api";
import { toast } from "sonner";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useMediaRecorder } from "@/hooks/useMediaRecorder";

const InterviewRoom = () => {
  const navigate = useNavigate();
  const api = useApi();
  const [timer, setTimer] = useState(0);
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);
  
  // Interactive state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [interviewState, setInterviewState] = useState<"IDLE" | "GENERATING" | "READY" | "ACTIVE" | "COMPLETED">("IDLE");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Audio hooks
  const { speak, cancel: cancelSpeech, speaking: aiSpeaking } = useSpeechSynthesis();
  const { listening, transcript, startListening, stopListening, supported: sttSupported } = useSpeechRecognition();
  const { startRecording, stopRecording } = useMediaRecorder();
  
  // Track answer per question
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync transcript to current answer
  useEffect(() => {
    if (transcript) {
      setCurrentAnswer(transcript);
    }
  }, [transcript]);

  // Initial setup
  useEffect(() => {
    (async () => {
      try {
        const res = await api.createInterview({});
        const id = res?.interview?.id as string | undefined;
        if (!id) return;
        setInterviewId(id);
        
        // Load full interview details to restore state if resuming
        const fullInterview = await api.getInterview(id);
        const savedAnswers = fullInterview?.interview?.answers || [];
        const answersMap: Record<string, string> = {};
        savedAnswers.forEach((a: any) => {
          answersMap[a.questionId] = a.answerText;
        });
        setAnswers(answersMap);

        if (fullInterview?.interview?.status === "COMPLETED") {
             setInterviewState("COMPLETED");
             return;
        }

        await api.updateInterview(id, { status: "IN_PROGRESS", startedAt: new Date().toISOString() });
        
        // Auto-generate questions on load if not present
        const existingQuestions = fullInterview?.interview?.questions || [];
        if (existingQuestions.length > 0) {
           setQuestions(existingQuestions);
           // If we have answers, maybe jump to the first unanswered question?
           const firstUnansweredIdx = existingQuestions.findIndex((q: any) => !answersMap[q.id]);
           if (firstUnansweredIdx >= 0) {
             setCurrentQuestionIndex(firstUnansweredIdx);
           }
           setInterviewState("READY");
           setGenerating(false);
        } else {
            setInterviewState("GENERATING");
            setGenerating(true);
            try {
              const q = await api.generateInterviewQuestions(id, { questionCount: 8, difficultyTarget: "MEDIUM" });
              const qs = (q?.questions as any[]) ?? [];
              setQuestions(qs);
              setInterviewState("READY");
            } catch (err: any) {
              toast.error(err.message || "Failed to generate questions.");
              setInterviewState("IDLE");
            } finally {
              setGenerating(false);
            }
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to start interview session.");
      }
    })();
  }, []);

  // Handle speaking the current question when index changes or state becomes ACTIVE
  useEffect(() => {
    if (interviewState === "ACTIVE" && questions[currentQuestionIndex]) {
      const q = questions[currentQuestionIndex];
      speak(q.question, () => {
        // Auto-start listening after question is read
        if (sttSupported) {
          startListening();
          startRecording();
        }
      });
    }
  }, [currentQuestionIndex, interviewState, questions]);

  const handleStartInterview = () => {
    setInterviewState("ACTIVE");
    setCurrentQuestionIndex(0);
  };

  const handleNextQuestion = async () => {
    // 1. Save current answer locally
    const q = questions[currentQuestionIndex];
    if (!q) return;
    
    // Stop listening if active
    stopListening();
    cancelSpeech();
    
    // Stop recording and get blob
    let audioUrl: string | null = null;
    try {
      const audioBlob = await stopRecording();
      if (audioBlob && audioBlob.size > 0) {
        const uploadRes = await api.uploadAudio(audioBlob);
        audioUrl = uploadRes?.url || null;
      }
    } catch (e) {
      console.error("Failed to upload audio", e);
    }

    const answerText = currentAnswer.trim() || answers[q.id] || "(No answer provided)";
    setAnswers(prev => ({ ...prev, [q.id]: answerText }));
    
    setIsProcessing(true);
    
    try {
      // 2. Submit partial answer to backend (incremental save)
      if (interviewId) {
        const payload = {
          answers: [{ questionId: q.id, answerText: answerText, audioUrl }]
        };
        // @ts-ignore
        await api.submitInterviewAnswers(interviewId, payload);
      }
      
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setCurrentAnswer(""); // Clear for next
      } else {
        await finishInterview();
      }
    } catch (err: any) {
      toast.error("Failed to save answer: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const finishInterview = async () => {
    if (!interviewId) return;
    setInterviewState("COMPLETED");
    setIsProcessing(true);
    
    try {
      await api.generateInterviewAssessment(interviewId);
      
      await api.updateInterview(interviewId, { status: "COMPLETED", endedAt: new Date().toISOString() });
      toast.success("Interview completed!");
      navigate(`/feedback?interviewId=${encodeURIComponent(interviewId)}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit interview.");
      setInterviewState("ACTIVE"); // Revert if failed
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const currentQ = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-4">
          <PrepWiseLogo size="sm" />
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${interviewState === "ACTIVE" ? "bg-destructive animate-pulse" : "bg-muted"}`} />
            <span className="text-sm text-muted-foreground">
              {interviewState === "ACTIVE" ? "LIVE INTERVIEW" : "PREPARING SESSION"}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-secondary rounded-full text-foreground font-mono text-sm">
            {formatTime(timer)}
          </div>
          <Avatar className="h-10 w-10 border-2 border-success">
            <AvatarFallback className="bg-success text-success-foreground">AI</AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex gap-6 p-6 overflow-hidden">
        {/* Left: AI Avatar & Controls */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 bg-card rounded-2xl border border-border overflow-hidden relative flex flex-col items-center justify-center p-8">
            
            {/* AI Visual */}
            <div className="relative mb-8">
              <div className={`w-48 h-48 lg:w-64 lg:h-64 rounded-full border-4 ${aiSpeaking ? "border-primary animate-pulse" : "border-secondary"} overflow-hidden relative transition-all duration-300`}>
                <img 
                  src={aiInterviewer} 
                  alt="AI Interviewer" 
                  className="w-full h-full object-cover"
                />
                {/* Overlay when speaking */}
                {aiSpeaking && (
                  <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                    <Volume2 className="text-white w-12 h-12 animate-bounce" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-background border border-border rounded-full shadow-sm flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${aiSpeaking ? "bg-green-500" : "bg-slate-400"}`} />
                <span className="text-xs font-medium whitespace-nowrap">AI Interviewer</span>
              </div>
            </div>

            {/* Status Text */}
            <div className="h-8 mb-4">
              {aiSpeaking ? (
                <p className="text-primary font-medium animate-pulse">Speaking question...</p>
              ) : listening ? (
                <p className="text-green-500 font-medium animate-pulse">Listening to you...</p>
              ) : interviewState === "ACTIVE" ? (
                <p className="text-muted-foreground">Waiting for your answer...</p>
              ) : (
                <p className="text-muted-foreground">Session Ready</p>
              )}
            </div>

            {/* Audio Visualizer Bar (Fake) */}
            <div className="flex items-end justify-center gap-1 h-12 w-64 mb-8">
              {[...Array(20)].map((_, i) => (
                <div 
                  key={i}
                  className={`w-1.5 rounded-t-sm transition-all duration-75 ${
                    (aiSpeaking || listening) ? "bg-primary" : "bg-secondary"
                  }`}
                  style={{ 
                    height: (aiSpeaking || listening) ? `${Math.random() * 100}%` : "4px",
                    opacity: (aiSpeaking || listening) ? 1 : 0.3
                  }}
                />
              ))}
            </div>

            {/* User Video Pip */}
            <div className="absolute bottom-6 left-6 w-48 h-32 bg-black rounded-xl border border-border overflow-hidden shadow-lg">
              <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                <Video className="text-zinc-600" size={32} />
              </div>
              <div className="absolute bottom-2 left-2 flex items-center gap-2">
                <div className={`p-1 rounded-full ${listening ? "bg-green-500" : "bg-red-500/80"}`}>
                  {listening ? <Mic size={10} className="text-white" /> : <MicOff size={10} className="text-white" />}
                </div>
                <span className="text-xs text-white font-medium drop-shadow-md">You</span>
              </div>
            </div>
          </div>

          {/* Bottom Control Bar */}
          <div className="mt-6 h-20 bg-card border border-border rounded-xl px-6 flex items-center justify-between">
             <div className="flex items-center gap-4">
               <Button 
                variant={listening ? "default" : "outline"}
                size="icon" 
                className={`h-12 w-12 rounded-full ${listening ? "bg-red-500 hover:bg-red-600 text-white border-none" : ""}`}
                onClick={() => {
                  if (listening) {
                    stopListening();
                    // We don't stop recording here, we let it run until Next Question or manually stopped
                    // But typically stopListening implies stop interaction. 
                    // Let's keep recording running until the end of the answer to capture full context or pause it?
                    // Simpler: Just toggle both.
                    // stopRecording(); // Actually we want to keep one recording per question session or multiple?
                    // The hook handles one stream. Let's stop it too.
                    stopRecording().then(blob => {
                       // If user stops manually, we might want to stash the blob?
                       // For now, let's assume manual toggle is just for pause/resume of STT
                       // But MediaRecorder doesn't support pause well in this hook.
                       // Let's NOT stop recording on manual toggle, only on "Next".
                       // Or better: Restarting listening should restart recording if it was stopped.
                    });
                  } else {
                    startListening();
                    startRecording();
                  }
                }}
                disabled={!sttSupported || interviewState !== "ACTIVE" || aiSpeaking}
              >
                {listening ? <MicOff size={20} /> : <Mic size={20} />}
              </Button>
               {!sttSupported && <span className="text-xs text-destructive">Browser STT not supported</span>}
             </div>

             <div className="flex items-center gap-4">
               {interviewState === "READY" && (
                 <Button 
                   className="h-12 px-8 gradient-primary text-primary-foreground text-lg shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                   onClick={handleStartInterview}
                 >
                   <Play size={20} className="mr-2 fill-current" />
                   Start Interview
                 </Button>
               )}

               {interviewState === "ACTIVE" && (
                 <Button 
                   className="h-12 px-8 gradient-primary text-primary-foreground"
                   onClick={handleNextQuestion}
                   disabled={isProcessing || aiSpeaking}
                 >
                   {isProcessing ? (
                     <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                   ) : currentQuestionIndex < questions.length - 1 ? (
                     <>
                       Next Question <ArrowRight className="ml-2 h-5 w-5" />
                     </>
                   ) : (
                     <>
                       Finish & Submit <CheckCircle className="ml-2 h-5 w-5" />
                     </>
                   )}
                 </Button>
               )}
             </div>

             <div className="flex items-center gap-4">
               <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive hover:bg-destructive/10"
                 onClick={() => navigate("/dashboard")}
               >
                 <Phone size={20} className="rotate-[135deg]" />
               </Button>
             </div>
          </div>
        </div>

        {/* Right: Question & Transcript */}
        <div className="w-[400px] bg-card rounded-2xl border border-border flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border bg-secondary/20">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <AlignLeft size={18} />
              {interviewState === "ACTIVE" ? `Question ${currentQuestionIndex + 1} of ${questions.length}` : "Interview Script"}
            </h3>
          </div>

          <div className="flex-1 p-6 overflow-auto flex flex-col gap-6">
            {interviewState === "GENERATING" && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-muted-foreground">Generating interview questions based on your profile...</p>
              </div>
            )}

            {interviewState === "READY" && (
              <div className="text-center space-y-4 my-auto">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                  <CheckCircle size={32} />
                </div>
                <h4 className="text-xl font-bold">You're all set!</h4>
                <p className="text-muted-foreground text-sm">
                  We've prepared {questions.length} questions for you. 
                  Ensure your microphone is ready and click Start to begin.
                </p>
              </div>
            )}

            {interviewState === "ACTIVE" && currentQ && (
              <>
                {/* Active Question Card */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="text-xs font-bold text-primary mb-2 uppercase tracking-wider">
                    Current Question
                  </div>
                  <div className="p-5 bg-background border border-border rounded-xl shadow-sm text-lg font-medium leading-relaxed">
                    {currentQ.question}
                  </div>
                </div>

                {/* Live Transcript */}
                <div className="flex-1 min-h-[200px] flex flex-col">
                  <div className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider flex justify-between">
                    <span>Your Answer (Transcript)</span>
                    {listening && <span className="text-green-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/> Live</span>}
                  </div>
                  <textarea
                    className="flex-1 w-full bg-secondary/30 border border-border rounded-xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder={sttSupported ? "Speak your answer... (transcript will appear here)" : "Type your answer here..."}
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                  />
                  {!sttSupported && (
                    <p className="text-xs text-orange-500 mt-2 flex items-center gap-1">
                      <AlertCircle size={12} /> Microphone not supported in this browser. Please type your answer.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewRoom;
