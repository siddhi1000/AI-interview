import { Calendar, Clock, Star, ChevronRight } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";

const DashboardHistory = () => {
  const interviews = [
    {
      id: 1,
      title: "Full Stack Interview",
      date: "Mar 19, 2025",
      duration: "45 min",
      score: 92,
      type: "Technical",
      status: "completed",
    },
    {
      id: 2,
      title: "Front End Interview",
      date: "Mar 17, 2025",
      duration: "30 min",
      score: 85,
      type: "Mixed",
      status: "completed",
    },
    {
      id: 3,
      title: "System Design Interview",
      date: "Mar 15, 2025",
      duration: "60 min",
      score: 78,
      type: "Technical",
      status: "completed",
    },
    {
      id: 4,
      title: "Behavioral Interview",
      date: "Mar 12, 2025",
      duration: "25 min",
      score: 88,
      type: "Behavioral",
      status: "completed",
    },
    {
      id: 5,
      title: "Backend Interview",
      date: "Mar 10, 2025",
      duration: "40 min",
      score: 72,
      type: "Technical",
      status: "completed",
    },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar variant="user" />
      
      <main className="flex-1 p-8 overflow-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Interview History</h1>
          <p className="text-muted-foreground">
            Review all your past interview sessions and track your progress over time.
          </p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-muted-foreground text-sm">Total Interviews</p>
            <p className="text-2xl font-bold text-foreground">{interviews.length}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-muted-foreground text-sm">Average Score</p>
            <p className="text-2xl font-bold text-green-400">83%</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-muted-foreground text-sm">Total Time</p>
            <p className="text-2xl font-bold text-foreground">3h 20m</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-muted-foreground text-sm">Best Score</p>
            <p className="text-2xl font-bold text-primary">92%</p>
          </div>
        </div>

        {/* Interview List */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">All Interviews</h2>
          </div>
          
          <div className="divide-y divide-border">
            {interviews.map((interview) => (
              <div 
                key={interview.id}
                className="p-4 hover:bg-secondary/30 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Star className="text-primary" size={20} />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{interview.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {interview.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {interview.duration}
                      </span>
                      <span className="px-2 py-0.5 bg-secondary rounded-full text-xs">
                        {interview.type}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className={`text-xl font-bold ${getScoreColor(interview.score)}`}>
                      {interview.score}%
                    </p>
                    <p className="text-xs text-muted-foreground">Score</p>
                  </div>
                  <Button variant="ghost" size="icon">
                    <ChevronRight size={20} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardHistory;
