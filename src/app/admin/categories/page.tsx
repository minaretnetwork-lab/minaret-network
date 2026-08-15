import { getCategoriesForAdmin, toggleCategoryRegulatedStatus } from "@/lib/actions/admin";
import { CategoryIcon } from "@/components/ui/category-icon";
import { ShieldAlert, Tag } from "lucide-react";

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Categories</h1>
        <p className="mt-1 text-sm text-gray-500">
          Mark categories as regulated to exclude them from the service-request broadcast flow and block the
          broadcast-eligible listing tier. Regulated professions remain fully visible in search and browsing.
        </p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-900/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2">
        <ShieldAlert className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <span>
          <strong>{regulatedCount}</strong> regulated {regulatedCount === 1 ? "category" : "categories"}.{" "}
          Marking a category as regulated will immediately demote any broadcast-eligible listings in it back to Standard.
        </span>
      </div>

      {categories.length > 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Category</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Listings</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Regulated profession?</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <CategoryIcon slug={cat.slug} className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                      <div>
                        <p>{cat.name}</p>
                        <p className="text-xs font-normal text-gray-400">{cat.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{cat._count.professionals}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      cat.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                    }`}>
                      {cat.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {cat.isRegulatedProfession && (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400">
                          <ShieldAlert className="h-3.5 w-3.5" />
                          Regulated
                        </span>
                      )}
                      <form action={toggleRegulated}>
                        <input type="hidden" name="categoryId" value={cat.id} />
                        <input type="hidden" name="isRegulated" value={cat.isRegulatedProfession ? "false" : "true"} />
                        <button
                          type="submit"
                          className={`rounded-lg border px-3 py-1 text-xs font-medium transition-colors ${
                            cat.isRegulatedProfession
                              ? "border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                              : "border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400"
                          }`}
                        >
                          {cat.isRegulatedProfession ? "Unmark" : "Mark as regulated"}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-6 text-center">
          <p className="text-amber-800 dark:text-amber-300 font-medium mb-2">No categories seeded yet</p>
          <p className="text-sm text-amber-700 dark:text-amber-400">Run the database seed script to populate categories.</p>
          <pre className="mt-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg p-3 text-xs text-left text-amber-900 dark:text-amber-200">npx prisma db seed</pre>
        </div>
      )}

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
