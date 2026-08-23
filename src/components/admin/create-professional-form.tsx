"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CategoryIcon } from "@/components/ui/category-icon";
import { PhoneInput } from "@/components/ui/phone-input";
import { LANGUAGES } from "@/lib/constants";
import { createUnclaimedProfessional } from "@/lib/actions/admin";
import { Loader2 } from "lucide-react";

interface Category { id: string; name: string; slug: string; icon?: string | null }
interface ServiceArea { id: string; name: string }

interface Props {
  categories: Category[];
  serviceAreas: ServiceArea[];
}

export function CreateProfessionalForm({ categories, serviceAreas }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [acceptsWalkIns, setAcceptsWalkIns] = useState(false);
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  function toggleSet<T extends string>(
    set: T[],
    setFn: (v: T[]) => void,
    value: T
  ) {
    setFn(set.includes(value) ? set.filter((v) => v !== value) : [...set, value]);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("phone", phone);
    fd.set("whatsapp", whatsapp);
    fd.set("acceptsWalkIns", String(acceptsWalkIns));
    selectedCategories.forEach((id) => fd.append("categoryIds", id));
    if (selectedCategories[0]) fd.set("categoryId", selectedCategories[0]);
    selectedAreas.forEach((id) => fd.append("serviceAreaIds", id));
    selectedLanguages.forEach((l) => fd.append("languages", l));

    startTransition(async () => {
      const result = await createUnclaimedProfessional(fd);
      if (!result.ok) {
        setError(result.error ?? "Something went wrong.");
        return;
      }
      router.push(`/admin/professionals/${result.id}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
      {/* Categories */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
          Category <span className="text-red-500">*</span>
        </h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const selected = selectedCategories.includes(cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleSet(selectedCategories, setSelectedCategories, cat.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-colors ${
                  selected
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-emerald-400"
                }`}
              >
                <CategoryIcon slug={cat.slug} icon={cat.icon} className="h-3.5 w-3.5" />
                {cat.name}
              </button>
            );
          })}
        </div>
        {selectedCategories.length === 0 && (
          <p className="text-xs text-gray-400 mt-2">Select at least one category</p>
        )}
      </section>

      {/* Basic info */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Business Info</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="businessName">Business Name</Label>
            <Input id="businessName" name="businessName" placeholder="Acme Plumbing Inc." />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="title">Title / Role</Label>
            <Input id="title" name="title" placeholder="e.g. Certified Plumber" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bio">About / Bio</Label>
          <Textarea id="bio" name="bio" rows={4} placeholder="Describe the business or professional…" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="yearsOfExperience">Years of Experience</Label>
            <Input id="yearsOfExperience" name="yearsOfExperience" type="number" min={0} max={80} placeholder="5" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="availability">Availability</Label>
            <Input id="availability" name="availability" placeholder="Mon–Fri 9am–5pm" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="qualifications">Qualifications</Label>
          <Textarea id="qualifications" name="qualifications" rows={2} placeholder="Certifications, degrees…" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="licenses">Licences</Label>
          <Textarea id="licenses" name="licenses" rows={2} placeholder="License numbers, regulatory bodies…" />
        </div>
      </section>

      {/* Contact */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Contact Info</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <PhoneInput value={phone} onChange={setPhone} />
          </div>
          <div className="space-y-1.5">
            <Label>WhatsApp</Label>
            <PhoneInput value={whatsapp} onChange={setWhatsapp} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="info@example.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="website">Website</Label>
            <Input id="website" name="website" placeholder="example.com" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="businessAddress">Business Address</Label>
          <Input id="businessAddress" name="businessAddress" placeholder="123 Main St, Toronto, ON" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={acceptsWalkIns}
            onChange={(e) => setAcceptsWalkIns(e.target.checked)}
            className="rounded border-gray-300"
          />
          Accepts walk-ins
        </label>
      </section>

      {/* Languages */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">Languages</h2>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((lang) => {
            const selected = selectedLanguages.includes(lang);
            return (
              <button
                key={lang}
                type="button"
                onClick={() => toggleSet(selectedLanguages, setSelectedLanguages, lang)}
                className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
                  selected
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-emerald-400"
                }`}
              >
                {lang}
              </button>
            );
          })}
        </div>
      </section>

      {/* Service areas */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">Service Areas</h2>
        <div className="flex flex-wrap gap-2">
          {serviceAreas.map((area) => {
            const selected = selectedAreas.includes(area.id);
            return (
              <button
                key={area.id}
                type="button"
                onClick={() => toggleSet(selectedAreas, setSelectedAreas, area.id)}
                className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
                  selected
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-emerald-400"
                }`}
              >
                {area.name}
              </button>
            );
          })}
        </div>
      </section>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 rounded-lg bg-red-50 dark:bg-red-900/20 px-4 py-3 border border-red-200 dark:border-red-800">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={isPending || selectedCategories.length === 0}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Create Listing
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
