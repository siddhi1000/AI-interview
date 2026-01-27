import { Calendar, Star, Monitor, Smartphone, Cpu } from "lucide-react";
import { Button } from "./ui/button";

interface InterviewCardProps {
  title: string;
  date: string;
  score?: number | null;
  type: "MIXED" | "BEHAVIORAL" | "TECHNICAL";
  description: string;
  status?: "completed" | "pending" | "in-progress";
}

const InterviewCard = ({ title, date, score, type, description, status = "pending" }: InterviewCardProps) => {
  const getTypeColor = () => {
    switch (type) {
      case "BEHAVIORAL": return "bg-success/20 text-success";
      case "TECHNICAL": return "bg-primary/20 text-primary";
      default: return "bg-warning/20 text-warning";
    }
  };

  const getIcon = () => {
    if (title.toLowerCase().includes("full stack")) return Monitor;
    if (title.toLowerCase().includes("front end")) return Cpu;
    return Smartphone;
  };

  const Icon = getIcon();

  return (
    <div className="gradient-card border border-border rounded-xl p-5 hover:border-primary/40 transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="h-12 w-12 rounded-lg bg-secondary border border-border flex items-center justify-center group-hover:border-primary/40 transition-colors">
          <Icon className="text-primary" size={22} />
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded ${getTypeColor()}`}>
          {type}
        </span>
      </div>

      <h3 className="font-semibold text-foreground mb-2">{title}</h3>
      
      <div className="flex items-center gap-4 text-muted-foreground text-sm mb-3">
        <div className="flex items-center gap-1">
          <Calendar size={14} />
          <span>{date}</span>
        </div>
        <div className="flex items-center gap-1">
          <Star size={14} />
          <span>{score !== null && score !== undefined ? `${score}/100` : "---/100"}</span>
        </div>
      </div>
      
      <p className="text-muted-foreground text-sm leading-relaxed">
        {description}
      </p>

      {status === "completed" && (
        <Button variant="outline" className="w-full mt-4 border-border hover:bg-secondary">
          View Detailed Feedback
        </Button>
      )}
      {status === "in-progress" && (
        <Button variant="outline" className="w-full mt-4 border-border hover:bg-secondary">
          In Progress
        </Button>
      )}
    </div>
  );
};

export default InterviewCard;
