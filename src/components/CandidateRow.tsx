import { Button } from "./ui/button";
import ScoreBar from "./ScoreBar";

interface CandidateRowProps {
  name: string;
  email: string;
  totalInterviews: number;
  avgScore: number;
  lastActive: string;
  initials: string;
  color: string;
}

const CandidateRow = ({ 
  name, 
  email, 
  totalInterviews, 
  avgScore, 
  lastActive,
  initials,
  color 
}: CandidateRowProps) => {
  return (
    <tr className="border-b border-border hover:bg-secondary/30 transition-colors">
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <div 
            className="h-9 w-9 rounded-full flex items-center justify-center text-sm font-medium text-foreground"
            style={{ backgroundColor: color }}
          >
            {initials}
          </div>
          <span className="font-medium text-foreground">{name}</span>
        </div>
      </td>
      <td className="py-4 px-4 text-muted-foreground">{email}</td>
      <td className="py-4 px-4 text-center text-foreground">{totalInterviews}</td>
      <td className="py-4 px-4 w-32">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <ScoreBar score={avgScore} size="sm" showLabel={false} />
          </div>
          <span className="text-sm text-foreground">{avgScore}%</span>
        </div>
      </td>
      <td className="py-4 px-4 text-muted-foreground">{lastActive}</td>
      <td className="py-4 px-4">
        <Button size="sm" className="gradient-primary text-primary-foreground hover:opacity-90">
          Review
        </Button>
      </td>
    </tr>
  );
};

export default CandidateRow;
