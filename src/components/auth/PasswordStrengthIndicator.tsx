import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface PasswordStrengthProps {
  password?: string;
}

export function PasswordStrengthIndicator({ password = "" }: PasswordStrengthProps) {
  const { score, label, color } = useMemo(() => {
    if (!password) {
      return { score: 0, label: "Enter a password", color: "bg-slate-200" };
    }

    let calculatedScore = 0;
    if (password.length >= 8) calculatedScore += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) calculatedScore += 1;
    if (/[0-9]/.test(password)) calculatedScore += 1;
    if (/[^A-Za-z0-9]/.test(password)) calculatedScore += 1;

    switch (calculatedScore) {
      case 1:
        return { score: 1, label: "Weak", color: "bg-red-500" };
      case 2:
        return { score: 2, label: "Fair", color: "bg-amber-500" };
      case 3:
        return { score: 3, label: "Good", color: "bg-blue-500" };
      case 4:
        return { score: 4, label: "Strong", color: "bg-emerald-600" };
      default:
        return { score: 1, label: "Weak", color: "bg-red-500" };
    }
  }, [password]);

  if (!password) return null;

  return (
    <div className="space-y-1.5 pt-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">Password strength:</span>
        <span className={cn(
          "font-semibold",
          score <= 1 && "text-red-600",
          score === 2 && "text-amber-600",
          score === 3 && "text-blue-600",
          score >= 4 && "text-emerald-700"
        )}>
          {label}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={cn(
              "h-full rounded-full transition-all duration-300",
              step <= score ? color : "bg-slate-200"
            )}
          />
        ))}
      </div>
    </div>
  );
}
