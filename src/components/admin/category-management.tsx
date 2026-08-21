"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateCategory, deleteCategory } from "@/lib/actions/admin";
import { Pencil, Trash2, ShieldCheck, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  isActive: boolean;
  isRegulatedProfession: boolean;
  sortOrder: number;
  _count: { professionals: number };
};

export function CategoryManagement({
  categories,
  toggleRegulated,
}: {
  categories: Category[];
  toggleRegulated: (formData: FormData) => Promise<void>;
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function startEdit(cat: Category) {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditIcon(cat.icon ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditIcon("");
  }

  async function handleSave(id: string) {
    setSaving(true);
    try {
      await updateCategory(id, { name: editName.trim(), icon: editIcon.trim() || undefined });
      setEditingId(null);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteCategory(id);
      setConfirmDeleteId(null);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not delete category");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Category</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Slug</th>
            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Pros</th>
            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Regulated</th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {categories.map((cat) => (
            <tr key={cat.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              {editingId === cat.id ? (
                <td colSpan={5} className="px-4 py-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="w-16">
                      <Input
                        value={editIcon}
                        onChange={(e) => setEditIcon(e.target.value)}
                        placeholder="🏷️"
                        className="text-center"
                        maxLength={4}
                      />
                    </div>
                    <div className="flex-1 min-w-[160px]">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Category name"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSave(cat.id);
                          if (e.key === "Escape") cancelEdit();
                        }}
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleSave(cat.id)}
                      disabled={saving || !editName.trim()}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white"
                    >
                      <Check className="h-4 w-4" />
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={cancelEdit}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              ) : (
                <>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg leading-none">{cat.icon ?? "🏷️"}</span>
                      <span className="font-medium text-gray-900 dark:text-white">{cat.name}</span>
                      {!cat.isActive && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-400">inactive</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{cat.slug}</td>
                  <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-300">{cat._count.professionals}</td>
                  <td className="px-4 py-3 text-center">
                    <form action={toggleRegulated}>
                      <input type="hidden" name="categoryId" value={cat.id} />
                      <input type="hidden" name="isRegulated" value={String(!cat.isRegulatedProfession)} />
                      <button
                        type="submit"
                        title={cat.isRegulatedProfession ? "Click to unmark as regulated" : "Click to mark as regulated"}
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                          cat.isRegulatedProfession
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-200"
                            : "bg-gray-100 text-gray-400 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                        }`}
                      >
                        <ShieldCheck className="h-4 w-4" />
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEdit(cat)}
                        className="h-8 w-8 p-0 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>

                      {confirmDeleteId === cat.id ? (
                        <div className="flex items-center gap-1 text-xs">
                          <span className="text-red-600 dark:text-red-400 font-medium">Delete?</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={deletingId === cat.id}
                            onClick={() => handleDelete(cat.id)}
                            className="h-7 px-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            {deletingId === cat.id ? "…" : "Yes"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setConfirmDeleteId(null)}
                            className="h-7 px-2"
                          >
                            No
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={cat._count.professionals > 0}
                          onClick={() => setConfirmDeleteId(cat.id)}
                          title={cat._count.professionals > 0 ? `Cannot delete — ${cat._count.professionals} professional(s) use this category` : "Delete"}
                          className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </>
              )}
            </tr>
          ))}

          {categories.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400">
                No categories yet. Add one above.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
