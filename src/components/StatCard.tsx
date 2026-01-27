import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon?: LucideIcon;
  label: string;
  value: string | number;
  trend?: {
    value: string;
    positive: boolean;
  };
  variant?: "default" | "dark";
}

const StatCard = ({ icon: Icon, label, value, trend, variant = "default" }: StatCardProps) => {
  return (
    <div className={`rounded-xl p-5 border border-border ${
      variant === "dark" ? "bg-card" : "bg-secondary/50"
    }`}>
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Icon className="text-primary" size={20} />
          </div>
        )}
        <div className="flex-1">
          <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">{label}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">{value}</span>
            {trend && (
              <span className={`text-sm font-medium ${
                trend.positive ? "text-success" : "text-destructive"
              }`}>
                {trend.positive ? "↗" : "↘"} {trend.value}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
