import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  light?: boolean;
}

const Logo = ({ className, size = "md", showText = false, light = false }: LogoProps) => {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  };

  return (
    <div className={cn("flex items-center gap-2.5 group", className)}>
      <div className={cn(
        "bg-brand-yellow flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105",
        sizeClasses[size],
        size === "sm" ? "rounded-lg" : "rounded-xl"
      )}>
        <img
          src="/logo.jpeg"
          alt="InnoVestor Logo"
          className="w-full h-full object-cover scale-110"
        />
      </div>
      {showText && (
        <span className={cn(
          "font-bold tracking-tight",
          light ? "text-white" : "text-brand-charcoal",
          size === "sm" ? "text-base" :
            size === "md" ? "text-xl" :
              "text-2xl"
        )}>
          INNOVESTOR
        </span>
      )}
    </div>
  );
};

export default Logo;
