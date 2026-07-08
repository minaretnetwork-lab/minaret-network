import { CheckCircle, Star } from "lucide-react";
import type { BadgeType } from "@/types";

const BADGE_STYLES: Record<BadgeType, string> = {
  MOSQUE_AFFILIATED: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
  HIGHLY_RECOMMENDED: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
};

interface VerificationBadgesProps {
  badges: { id: string; type: BadgeType }[];
  mosqueName?: string;
  size?: "sm" | "md";
}

export function VerificationBadges({ badges, mosqueName, size = "md" }: VerificationBadgesProps) {
  if (badges.length === 0) return null;

  const sizeClass = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1";

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge) => (
        <span
          key={badge.id}
          className={`inline-flex items-center gap-1.5 border rounded-full font-medium ${sizeClass} ${BADGE_STYLES[badge.type]}`}
        >
          {badge.type === "MOSQUE_AFFILIATED" ? (
            <>
              <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />
              {mosqueName ? `Affiliated with ${mosqueName}` : "Mosque Affiliated"}
            </>
          ) : (
            <>
              <Star className="h-3.5 w-3.5 fill-current flex-shrink-0" />
              Highly Recommended
            </>
          )}
        </span>
      ))}
    </div>
  );
}
