import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";

type BadgeType = "verified" | "estimated" | "ai-insight";

interface DataConfidenceBadgeProps {
  type: BadgeType;
  confidence?: "high" | "medium" | "low";
  className?: string;
}

const badgeConfigHi: Record<BadgeType, { label: string; icon: string }> = {
  verified: { label: "सत्यापित डेटा", icon: "✓" },
  estimated: { label: "अनुमानित", icon: "≈" },
  "ai-insight": { label: "एआई विश्लेषण", icon: "🤖" },
};

const badgeConfigEn: Record<BadgeType, { label: string; icon: string }> = {
  verified: { label: "Verified Data", icon: "✓" },
  estimated: { label: "Estimated", icon: "≈" },
  "ai-insight": { label: "AI Insight", icon: "🤖" },
};

const confidenceConfigHi: Record<string, { label: string; color: string }> = {
  high: { label: "उच्च विश्वसनीयता", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  medium: { label: "मध्यम विश्वसनीयता", color: "bg-amber-50 text-amber-700 border-amber-200" },
  low: { label: "कम विश्वसनीयता", color: "bg-gray-50 text-gray-600 border-gray-200" },
};

const confidenceConfigEn: Record<string, { label: string; color: string }> = {
  high: { label: "Confidence: High", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  medium: { label: "Confidence: Medium", color: "bg-amber-50 text-amber-700 border-amber-200" },
  low: { label: "Confidence: Low", color: "bg-gray-50 text-gray-600 border-gray-200" },
};

export function DataConfidenceBadge({
  type,
  confidence,
  className,
}: DataConfidenceBadgeProps) {
  const { language } = useLanguage();
  const isHi = language === "hi";
  const config = isHi ? badgeConfigHi[type] : badgeConfigEn[type];
  const confConfig = isHi ? confidenceConfigHi : confidenceConfigEn;

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
          type === "verified" && "bg-emerald-50 text-emerald-700 border-emerald-200",
          type === "estimated" && "bg-amber-50 text-amber-700 border-amber-200",
          type === "ai-insight" && "bg-blue-50 text-blue-700 border-blue-200",
        )}
      >
        <span className="text-[10px]">{config.icon}</span>
        {config.label}
      </span>
      {confidence && confConfig[confidence] && (
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
            confConfig[confidence].color,
          )}
        >
          {confConfig[confidence].label}
        </span>
      )}
    </div>
  );
}
