import { GraduationCap } from "lucide-react";

interface PrepWiseLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const PrepWiseLogo = ({ size = "md", showText = true }: PrepWiseLogoProps) => {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`${sizeClasses[size]} rounded-lg gradient-primary flex items-center justify-center`}>
        <GraduationCap className="text-primary-foreground" size={iconSizes[size]} />
      </div>
      {showText && (
        <span className={`font-bold text-foreground ${textSizes[size]}`}>PrepWise</span>
      )}
    </div>
  );
};

export default PrepWiseLogo;
