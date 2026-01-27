import { LucideIcon } from "lucide-react";
import ScoreBar from "./ScoreBar";

interface CategoryScoreCardProps {
  icon: LucideIcon;
  title: string;
  score: number;
  description: string;
  index: number;
}

const CategoryScoreCard = ({ icon: Icon, title, score, description, index }: CategoryScoreCardProps) => {
  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
            <Icon className="text-primary" size={18} />
          </div>
          <h3 className="font-semibold text-foreground">
            {index}. {title}
          </h3>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-foreground">{score}</span>
          <span className="text-muted-foreground text-sm">/100</span>
        </div>
      </div>
      
      <div className="mb-4">
        <ScoreBar score={score} showLabel={false} />
      </div>
      
      <p className="text-muted-foreground text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
};

export default CategoryScoreCard;
