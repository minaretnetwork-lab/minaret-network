"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { approveRecommendation, rejectRecommendation } from "@/lib/actions/recommendations";
import { formatDate } from "@/lib/utils";
import { CheckCircle, XCircle, Star } from "lucide-react";

type Recommendation = {
  id: string;
  content: string;
  highlyRecommended: boolean;
  createdAt: Date;
  approvedAt?: Date | null;
  professional: {
    user: { firstName: string | null; lastName: string | null; displayName: string | null };
    category: { name: string };
  };
  user: { firstName: string | null; lastName: string | null; displayName: string | null; email: string };
};

interface Props {
  recommendations: Recommendation[];
  type: "pending" | "approved";
}

export function RecommendationModerationList({ recommendations, type }: Props) {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleApprove(id: string) {
    setLoading(id + "-approve");
    await approveRecommendation(id);
    setLoading(null);
  }

  async function handleReject(id: string) {
    setLoading(id + "-reject");
    await rejectRecommendation(id);
    setLoading(null);
  }

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-10 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
        <p className="text-sm text-gray-400">Nothing here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recommendations.map((rec) => {
        const profName = rec.professional.user.displayName ??
          [rec.professional.user.firstName, rec.professional.user.lastName].filter(Boolean).join(" ");
        const memberName = rec.user.displayName ??
          [rec.user.firstName, rec.user.lastName].filter(Boolean).join(" ") ?? rec.user.email;

        return (
          <div key={rec.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
            <div className="flex gap-4 justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-medium text-green-700 dark:text-green-400">
                    For: {profName} ({rec.professional.category.name})
                  </span>
                  {rec.highlyRecommended && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                      <Star className="h-2.5 w-2.5 fill-current" /> Highly Recommended
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">&ldquo;{rec.content}&rdquo;</p>
                <p className="text-xs text-gray-400 mt-2">
                  By {memberName} · {formatDate(rec.createdAt)}
                </p>
              </div>
              {type === "pending" && (
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <Button size="sm" onClick={() => handleApprove(rec.id)} disabled={!!loading}
                    className="bg-green-600 hover:bg-green-700 text-white gap-1">
                    <CheckCircle className="h-3.5 w-3.5" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleReject(rec.id)} disabled={!!loading}
                    className="border-red-200 text-red-700 hover:bg-red-50 gap-1">
                    <XCircle className="h-3.5 w-3.5" /> Reject
                  </Button>
                </div>
              )}
              {type === "approved" && (
                <span className="text-xs text-green-600 flex items-center gap-1 flex-shrink-0">
                  <CheckCircle className="h-3.5 w-3.5" /> Published
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
