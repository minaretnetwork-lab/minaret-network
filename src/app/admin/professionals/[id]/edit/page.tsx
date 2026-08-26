import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getCategoriesForAdmin, getProfessionalForAdmin, updateProfessionalByAdmin } from "@/lib/actions/admin";
import { prisma } from "@/lib/prisma";
import { LANGUAGES } from "@/lib/constants";
import { AddressAutocompleteInput } from "@/components/ui/address-autocomplete-input";

export const metadata = { title: "Edit Listing — Admin" };

export default async function AdminEditProfessionalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [professional, allCategories, allServiceAreas] = await Promise.all([
    getProfessionalForAdmin(id),
    getCategoriesForAdmin(),
    prisma.serviceArea.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!professional) notFound();

  const primaryCategoryId = professional.category.id;
  const secondaryCategoryIds = professional.categories
    .filter(c => c.id !== primaryCategoryId)
    .map(c => c.id);
  const selectedAreaIds = professional.serviceAreas.map(a => a.id);

  async function updateAction(formData: FormData) {
    "use server";
    const result = await updateProfessionalByAdmin(id, formData);
    if (result.ok) redirect(`/admin/professionals/${id}`);
  }

  const name =
    professional.businessName ??
    professional.user?.displayName ??
    ([professional.user?.firstName, professional.user?.lastName].filter(Boolean).join(" ") || null) ??
    professional.title ??
    "Unnamed";

  return (
    <div className="space-y-6">
      <Link
        href={`/admin/professionals/${id}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-emerald-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to listing
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit: {name}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Changes are applied immediately without an approval step.
        </p>
      </div>

      <form action={updateAction} className="space-y-8 max-w-2xl">

        {/* Category */}
        <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Category</h2>
          <div className="space-y-1.5">
            <Label htmlFor="categoryId">Primary category <span className="text-red-500">*</span></Label>
            <select
              id="categoryId"
              name="categoryId"
              defaultValue={primaryCategoryId}
              className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {allCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Additional categories</Label>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {allCategories.map(cat => (
                <label key={cat.id} className="flex items-center gap-1.5 text-sm cursor-pointer text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    name="categoryIds"
                    value={cat.id}
                    defaultChecked={secondaryCategoryIds.includes(cat.id)}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  {cat.name}
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-400">The primary category above takes precedence; these are secondary.</p>
          </div>
        </section>

        {/* Business info */}
        <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Business Info</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="businessName">Business Name</Label>
              <Input id="businessName" name="businessName" defaultValue={professional.businessName ?? ""} placeholder="Acme Plumbing Inc." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="title">Title / Role</Label>
              <Input id="title" name="title" defaultValue={professional.title ?? ""} placeholder="e.g. Certified Plumber" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bio">About / Bio</Label>
            <Textarea id="bio" name="bio" rows={4} defaultValue={professional.bio ?? ""} />
          </div>
          <div className="space-y-1.5 max-w-xs">
            <Label htmlFor="yearsOfExperience">Years of Experience</Label>
            <Input
              id="yearsOfExperience"
              name="yearsOfExperience"
              type="number"
              min={0}
              max={80}
              defaultValue={professional.yearsOfExperience ?? ""}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="availability">Availability</Label>
            <Textarea
              id="availability"
              name="availability"
              rows={2}
              defaultValue={professional.availability ?? ""}
              placeholder="e.g. Mon–Fri: 9:00 AM–5:00 PM"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="qualifications">Qualifications</Label>
            <Textarea id="qualifications" name="qualifications" rows={2} defaultValue={professional.qualifications ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="licenses">Licences</Label>
            <Textarea id="licenses" name="licenses" rows={2} defaultValue={professional.licenses ?? ""} />
          </div>
        </section>

        {/* Contact */}
        <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Contact Info</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" type="tel" defaultValue={professional.phone ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input id="whatsapp" name="whatsapp" type="tel" defaultValue={professional.whatsapp ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={professional.email ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="website">Website</Label>
              <Input id="website" name="website" defaultValue={professional.website ?? ""} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="businessAddress">Business Address</Label>
            <AddressAutocompleteInput name="businessAddress" defaultValue={professional.businessAddress ?? ""} />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              name="acceptsWalkIns"
              defaultChecked={professional.acceptsWalkIns}
              className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            Accepts walk-ins
          </label>
        </section>

        {/* Languages */}
        <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Languages</h2>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {LANGUAGES.map(lang => (
              <label key={lang} className="flex items-center gap-1.5 text-sm cursor-pointer text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  name="languages"
                  value={lang}
                  defaultChecked={professional.languages.includes(lang)}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                {lang}
              </label>
            ))}
          </div>
        </section>

        {/* Service areas */}
        <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Service Areas</h2>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {allServiceAreas.map(area => (
              <label key={area.id} className="flex items-center gap-1.5 text-sm cursor-pointer text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  name="serviceAreaIds"
                  value={area.id}
                  defaultChecked={selectedAreaIds.includes(area.id)}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                {area.name}
              </label>
            ))}
          </div>
        </section>

        <div className="flex gap-3">
          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
            Save Changes
          </Button>
          <Link href={`/admin/professionals/${id}`}>
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
