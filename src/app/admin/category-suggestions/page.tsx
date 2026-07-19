export const dynamic = "force-dynamic";

import { getCategorySuggestions, approveCategorySuggestion, rejectCategorySuggestion } from "@/lib/actions/category-suggestions";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Clock, Tag } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Category Suggestions | Admin" };

const STATUS_STYLES: Record<string, { pill: string; label: string; icon: React.ReactNode }> = {
  PENDING:  { pill: "bg-amber-100 text-amber-700 border-amber-200",  label: "Pending",  icon: <Clock className="h-3 w-3" /> },
  APPROVED: { pill: "bg-green-100 text-green-700 border-green-200",  label: "Approved", icon: <CheckCircle2 className="h-3 w-3" /> },
  REJECTED: { pill: "bg-red-100 text-red-700 border-red-200",        label: "Rejected", icon: <XCircle className="h-3 w-3" /> },
};

export default async function CategorySuggestionsPage() {
  const suggestions = await getCategorySuggestions();
  const pending  = suggestions.filter(s => s.status === "PENDING");
  const reviewed = suggestions.filter(s => s.status !== "PENDING");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Category Suggestions</h1>
        <p className="text-sm text-gray-500 mt-1">
          Professionals requested these categories during registration. Approve to add them sitewide.
        </p>
      </div>

      {suggestions.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
          <Tag className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No category suggestions yet.</p>
        </div>
      )}

      {pending.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-600 mb-3">
            Pending ({pending.length})
          </p>
          <div className="space-y-3">
            {pending.map((s) => {
              const requesterName = (s.requestedBy.displayName ??
                ([s.requestedBy.firstName, s.requestedBy.lastName].filter(Boolean).join(" ") ||
                s.requestedBy.email));
              return (
                <div key={s.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-xl flex-shrink-0">
                      {s.icon || "⭐"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white">{s.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Requested by <span className="font-medium">{requesterName}</span> · {formatDate(s.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <form action={async () => { "use server"; await rejectCategorySuggestion(s.id); }}>
                      <Button type="submit" size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 gap-1.5">
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </Button>
                    </form>
                    <form action={async () => { "use server"; await approveCategorySuggestion(s.id); }}>
                      <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                      </Button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {reviewed.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
            Reviewed ({reviewed.length})
          </p>
          <div className="space-y-2">
            {reviewed.map((s) => {
              const ui = STATUS_STYLES[s.status] ?? STATUS_STYLES.PENDING;
              const requesterName = (s.requestedBy.displayName ??
                ([s.requestedBy.firstName, s.requestedBy.lastName].filter(Boolean).join(" ") ||
                s.requestedBy.email));
              return (
                <div key={s.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xl">{s.icon || "⭐"}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{s.name}</p>
                      <p className="text-xs text-gray-400">{requesterName} · {formatDate(s.createdAt)}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium ${ui.pill}`}>
                    {ui.icon} {ui.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
