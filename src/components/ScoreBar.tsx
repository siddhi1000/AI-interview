interface ScoreBarProps {
  score: number;
  maxScore?: number;
  size?: "sm" | "md";
  showLabel?: boolean;
}

const ScoreBar = ({ score, maxScore = 100, size = "md", showLabel = true }: ScoreBarProps) => {
  const percentage = (score / maxScore) * 100;
  
  const getBarColor = () => {
    if (percentage >= 80) return "score-bar-green";
    if (percentage >= 60) return "score-bar-purple";
    if (percentage >= 40) return "score-bar-orange";
    return "bg-destructive";
  };

  const heightClass = size === "sm" ? "h-1.5" : "h-2";

  return (
    <div className="flex items-center gap-3">
      <div className={`flex-1 bg-secondary rounded-full ${heightClass} overflow-hidden`}>
        <div 
          className={`${heightClass} rounded-full ${getBarColor()} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-foreground font-semibold text-sm min-w-[48px] text-right">
          {score}<span className="text-muted-foreground font-normal">/{maxScore}</span>
        </span>
      )}
    </div>
  );
};

export default ScoreBar;
