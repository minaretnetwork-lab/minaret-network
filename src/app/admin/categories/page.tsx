import { getCategoriesForAdmin, toggleCategoryRegulatedStatus, createCategory } from "@/lib/actions/admin";
import { ShieldAlert, Tag, PlusCircle } from "lucide-react";
import { CategoryManagement } from "@/components/admin/category-management";

export const metadata = { title: "Categories | Admin" };

export default async function AdminCategoriesPage() {
  const categories = await getCategoriesForAdmin();
  const regulatedCount = categories.filter((c) => c.isRegulatedProfession).length;

  async function toggleRegulated(formData: FormData) {
    "use server";
    const categoryId = String(formData.get("categoryId") ?? "");
    const isRegulated = formData.get("isRegulated") === "true";
    if (!categoryId) return;
    await toggleCategoryRegulatedStatus(categoryId, isRegulated);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Categories</h1>
          <p className="mt-1 text-sm text-gray-500">
            Mark categories as regulated to exclude them from the service-request broadcast flow and block the
            broadcast-eligible listing tier. Regulated professions remain fully visible in search and browsing.
          </p>
        </div>
      </div>

      {/* Add Category */}
      <form action={createCategory} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Category name <span className="text-red-500">*</span></label>
          <input
            name="name"
            required
            placeholder="e.g. Halal Grocery"
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="w-36">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Icon (emoji) <span className="text-gray-400 font-normal">— auto if blank</span></label>
          <input
            name="icon"
            placeholder="auto"
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 px-4 py-2 text-sm font-semibold text-white transition-colors"
        >
          <PlusCircle className="h-4 w-4" />
          Add category
        </button>
      </form>

      <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-900/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2">
        <ShieldAlert className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <span>
          <strong>{regulatedCount}</strong> regulated {regulatedCount === 1 ? "category" : "categories"}.{" "}
          Marking a category as regulated will immediately demote any broadcast-eligible listings in it back to Standard.
        </span>
      </div>

      <CategoryManagement categories={categories} toggleRegulated={toggleRegulated} />

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 text-sm text-gray-500">
        <p className="font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
          <Tag className="h-4 w-4" />
          Bulk seed SQL — run once on the production database
        </p>
        <pre className="mt-2 rounded-lg bg-gray-50 dark:bg-gray-800 p-3 text-xs text-gray-600 dark:text-gray-300 overflow-x-auto">{`UPDATE categories
SET "isRegulatedProfession" = true
WHERE slug IN (
  'doctor','dentist','pharmacist','physiotherapist','chiropractor','optometrist','counsellor',
  'lawyer','immigration-consultant','notary-public',
  'financial-advisor','insurance-broker','mortgage-broker',
  'realtor'
);`}</pre>
      </div>
    </div>
  );
}
