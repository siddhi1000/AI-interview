import { LucideIcon, ArrowRight, Plus } from "lucide-react";

interface RoleCardProps {
  icon: LucideIcon;
  title: string;
  technologies?: string;
  isCustom?: boolean;
}

const RoleCard = ({ icon: Icon, title, technologies, isCustom = false }: RoleCardProps) => {
  return (
    <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all cursor-pointer group text-center">
      <div className="h-14 w-14 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
        <Icon className="text-primary" size={24} />
      </div>
      
      <h3 className="font-semibold text-foreground mb-2">{title}</h3>
      
      {technologies && (
        <p className="text-muted-foreground text-sm mb-4">{technologies}</p>
      )}
      
      {isCustom ? (
        <p className="text-muted-foreground text-sm mb-4">Define your own job description</p>
      ) : null}
      
      <div className="flex items-center justify-center gap-1 text-primary text-sm font-medium group-hover:gap-2 transition-all">
        {isCustom ? (
          <span>Configure</span>
        ) : (
          <>
            <span>Start Now</span>
            <ArrowRight size={16} />
          </>
        )}
      </div>
    </div>
  );
};

export default RoleCard;
