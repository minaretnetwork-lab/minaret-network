"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addSecondaryCategory, removeSecondaryCategory } from "@/lib/actions/admin";
import { Tag, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type Category = { id: string; name: string; slug: string; icon: string | null };

export function ProfessionalCategories({
  professionalId,
  primaryCategory,
  secondaryCategories,
  allCategories,
}: {
  professionalId: string;
  primaryCategory: Category;
  secondaryCategories: Category[];
  allCategories: Category[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const assignedIds = new Set([primaryCategory.id, ...secondaryCategories.map((c) => c.id)]);
  const available = allCategories.filter((c) => !assignedIds.has(c.id));

  async function handleAdd() {
    if (!selectedId) return;
    setSaving(true);
    try {
      await addSecondaryCategory(professionalId, selectedId);
      setAdding(false);
      setSelectedId("");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(categoryId: string) {
    setRemovingId(categoryId);
    try {
      await removeSecondaryCategory(professionalId, categoryId);
      router.refresh();
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="space-y-3">
      {/* Primary */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Primary</p>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-3 py-1 text-sm font-medium text-emerald-800 dark:text-emerald-300">
          <span>{primaryCategory.icon ?? "🏷️"}</span>
          {primaryCategory.name}
        </span>
      </div>

      {/* Secondary */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Also listed under</p>
        <div className="flex flex-wrap gap-2">
          {secondaryCategories.map((cat) => (
            <span
              key={cat.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-1 text-sm text-gray-700 dark:text-gray-300"
            >
              <span>{cat.icon ?? "🏷️"}</span>
              {cat.name}
              <button
                onClick={() => handleRemove(cat.id)}
                disabled={removingId === cat.id}
                title={`Remove ${cat.name}`}
                className="ml-0.5 rounded-full p-0.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {secondaryCategories.length === 0 && (
            <span className="text-sm text-gray-400 flex items-center gap-1">
              <Tag className="h-3.5 w-3.5" /> None added yet
            </span>
          )}
        </div>
      </div>

      {/* Add */}
      {adding ? (
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            autoFocus
            className="flex-1 min-w-[160px] rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Select category…</option>
            {available.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon ?? "🏷️"} {c.name}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            disabled={!selectedId || saving}
            onClick={handleAdd}
            className="bg-emerald-700 hover:bg-emerald-800 text-white"
          >
            {saving ? "Adding…" : "Add"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setSelectedId(""); }}>
            Cancel
          </Button>
        </div>
      ) : (
        available.length > 0 && (
          <Button size="sm" variant="outline" onClick={() => setAdding(true)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Add category
          </Button>
        )
      )}
    </div>
  );
}
