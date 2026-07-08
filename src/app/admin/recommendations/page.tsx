import { getPendingRecommendations } from "@/lib/actions/recommendations";
import { RecommendationModerationList } from "@/components/admin/recommendation-moderation";
import { prisma } from "@/lib/prisma";
import { DEFAULT_MOSQUE_SLUG } from "@/lib/constants";

export const metadata = { title: "Moderate Recommendations" };

export default async function AdminRecommendationsPage() {
  const pending = await getPendingRecommendations();

  const approved = await prisma.recommendation.findMany({
    where: { status: "APPROVED" },
    include: {
      professional: {
        include: {
          user: { select: { firstName: true, lastName: true, displayName: true } },
          category: { select: { name: true } },
        },
      },
      user: { select: { firstName: true, lastName: true, displayName: true, email: true } },
    },
    orderBy: { approvedAt: "desc" },
    take: 20,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Recommendations</h1>

      <section>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <span className="inline-flex h-5 w-5 rounded-full bg-amber-100 text-amber-700 text-xs items-center justify-center font-bold">
            {pending.length}
          </span>
          Pending Approval
        </h2>
        <RecommendationModerationList recommendations={pending as never} type="pending" />
      </section>

      <section>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Recently Approved</h2>
        <RecommendationModerationList recommendations={approved as never} type="approved" />
      </section>
    </div>
  );
}
