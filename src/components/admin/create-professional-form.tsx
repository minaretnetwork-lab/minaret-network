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

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIME_OPTIONS = [
  "6:00 AM","6:30 AM","7:00 AM","7:30 AM","8:00 AM","8:30 AM",
  "9:00 AM","9:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM",
  "12:00 PM","12:30 PM","1:00 PM","1:30 PM","2:00 PM","2:30 PM",
  "3:00 PM","3:30 PM","4:00 PM","4:30 PM","5:00 PM","5:30 PM",
  "6:00 PM","6:30 PM","7:00 PM","7:30 PM","8:00 PM","8:30 PM",
  "9:00 PM","9:30 PM","10:00 PM",
];
const PRESETS = [
  { label: "Weekdays 9–5", days: ["Mon","Tue","Wed","Thu","Fri"], from: "9:00 AM", to: "5:00 PM" },
  { label: "Weekdays + Sat", days: ["Mon","Tue","Wed","Thu","Fri","Sat"], from: "9:00 AM", to: "5:00 PM" },
  { label: "7 Days a Week", days: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], from: "9:00 AM", to: "6:00 PM" },
];

type DaySchedule = { from: string; to: string };

function timeToMinutes(value: string) {
  const match = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const period = match[3].toUpperCase();
  const normalizedHour = (hour % 12) + (period === "PM" ? 12 : 0);
  return normalizedHour * 60 + minute;
}

function buildAvailabilityString(schedules: Record<string, DaySchedule>, emergency: boolean) {
  const ordered = DAYS.filter((d) => d in schedules);
  if (ordered.length === 0) return "";
  const groups: { days: string[]; from: string; to: string }[] = [];
  for (const day of ordered) {
    const { from, to } = schedules[day];
    const last = groups[groups.length - 1];
    if (last && last.from === from && last.to === to) { last.days.push(day); }
    else { groups.push({ days: [day], from, to }); }
  }
  const parts = groups.map(({ days, from, to }) => {
    const label = days.length === 1 ? days[0] : `${days[0]}–${days[days.length - 1]}`;
    return `${label}: ${from}–${to}`;
  });
  return parts.join(", ") + (emergency ? ". Emergency calls available 24/7." : "");
}

const selectClass = "block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-200 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500";

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
  const [avSchedules, setAvSchedules] = useState<Record<string, DaySchedule>>({});
  const [avEmergency, setAvEmergency] = useState(false);

  function toggleSet<T extends string>(
    set: T[],
    setFn: (v: T[]) => void,
    value: T
  ) {
    setFn(set.includes(value) ? set.filter((v) => v !== value) : [...set, value]);
  }

  function toggleDay(day: string) {
    setAvSchedules((prev) => {
      const next = { ...prev };
      if (day in next) { delete next[day]; } else { next[day] = { from: "9:00 AM", to: "5:00 PM" }; }
      return next;
    });
  }

  function updateDayHours(day: string, field: "from" | "to", value: string) {
    setAvSchedules((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  }

  function applyPreset(preset: typeof PRESETS[number]) {
    const next: Record<string, DaySchedule> = {};
    preset.days.forEach((d) => { next[d] = { from: preset.from, to: preset.to }; });
    setAvSchedules(next);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("phone", phone);
    fd.set("whatsapp", whatsapp);
    fd.set("acceptsWalkIns", String(acceptsWalkIns));
    fd.set("availability", buildAvailabilityString(avSchedules, avEmergency));
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
        </div>
        {/* Availability builder */}
        <div className="space-y-1.5">
          <Label>Availability</Label>
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium uppercase tracking-wide">Quick Presets</p>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((preset) => (
                  <button key={preset.label} type="button" onClick={() => applyPreset(preset)}
                    className="text-xs px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium uppercase tracking-wide">Days</p>
              <div className="flex gap-1.5 flex-wrap">
                {DAYS.map((day) => (
                  <button key={day} type="button" onClick={() => toggleDay(day)}
                    className={`w-11 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                      day in avSchedules
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-emerald-400"
                    }`}>
                    {day}
                  </button>
                ))}
              </div>
            </div>
            {DAYS.filter((d) => d in avSchedules).length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Hours per day</p>
                {DAYS.filter((d) => d in avSchedules).map((day) => {
                  const from = avSchedules[day].from;
                  const to = avSchedules[day].to;
                  const fromMins = timeToMinutes(from);
                  const toMins = timeToMinutes(to);
                  const invalid = fromMins !== null && toMins !== null && toMins <= fromMins;
                  return (
                    <div key={day} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-9 flex-shrink-0 text-xs font-semibold ${invalid ? "text-red-600" : "text-gray-600 dark:text-gray-400"}`}>{day}</span>
                        <select value={from} onChange={(e) => updateDayHours(day, "from", e.target.value)}
                          className={`${selectClass} ${invalid ? "border-red-300" : ""} flex-1 text-xs py-1.5`}>
                          {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <span className="text-xs text-gray-400 flex-shrink-0">to</span>
                        <select value={to} onChange={(e) => updateDayHours(day, "to", e.target.value)}
                          className={`${selectClass} ${invalid ? "border-red-300" : ""} flex-1 text-xs py-1.5`}>
                          {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      {invalid && <p className="pl-11 text-xs text-red-600">End time must be after start time.</p>}
                    </div>
                  );
                })}
              </div>
            )}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={avEmergency}
                onChange={(e) => setAvEmergency(e.target.checked)}
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Emergency calls available 24/7</span>
            </label>
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
