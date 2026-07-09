"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LANGUAGES } from "@/lib/constants";
import { submitProfessionalApplication } from "@/lib/actions/professionals";
import { useRouter } from "next/navigation";
import { Camera, X, Building2 } from "lucide-react";

const schema = z.object({
  mosqueId: z.string().optional(),
  categoryId: z.string().min(1, "Please select a category"),
  businessName: z.string().optional(),
  title: z.string().min(2, "Job title is required"),
  bio: z.string().min(50, "Please write at least 50 characters").max(1000),
  yearsOfExperience: z.string().optional(),
  qualifications: z.string().optional(),
  licenses: z.string().optional(),
  languages: z.array(z.string()).min(1, "Select at least one language"),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  whatsapp: z.string().optional(),
  availability: z.string().optional(),
  serviceAreaIds: z.array(z.string()).min(1, "Select at least one service area"),
});

type FormData = z.infer<typeof schema>;

interface Category { id: string; name: string; icon?: string | null }
interface ServiceArea { id: string; name: string }
interface Mosque { id: string; name: string; city?: string | null; communityChannelType?: string | null; communityChannelName?: string | null }
interface Props { mosques: Mosque[]; categories: Category[]; serviceAreas: ServiceArea[] }

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

function buildAvailabilityString(days: string[], from: string, to: string, emergency: boolean): string {
  if (days.length === 0) return "";
  const sorted = [...days].sort((a, b) => DAYS.indexOf(a) - DAYS.indexOf(b));
  const key = sorted.join(",");
  let daysStr: string;
  if (key === "Mon,Tue,Wed,Thu,Fri") daysStr = "Monday–Friday";
  else if (key === "Mon,Tue,Wed,Thu,Fri,Sat") daysStr = "Monday–Saturday";
  else if (key === "Mon,Tue,Wed,Thu,Fri,Sat,Sun") daysStr = "7 days a week";
  else daysStr = sorted.join(", ");
  let result = `${daysStr}, ${from}–${to}`;
  if (emergency) result += ". Emergency calls available 24/7.";
  return result;
}

export function ProfessionalRegistrationForm({ mosques, categories, serviceAreas }: Props) {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("Image must be under 5 MB."); return; }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function removePhoto() {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (photoInputRef.current) photoInputRef.current.value = "";
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("Logo must be under 5 MB."); return; }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  function removeLogo() {
    setLogoFile(null);
    setLogoPreview(null);
    if (logoInputRef.current) logoInputRef.current.value = "";
  }

  const [avDays, setAvDays] = useState<string[]>([]);
  const [avFrom, setAvFrom] = useState("9:00 AM");
  const [avTo, setAvTo] = useState("5:00 PM");
  const [avEmergency, setAvEmergency] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { languages: [], serviceAreaIds: [] },
  });

  const selectedLanguages = watch("languages") ?? [];
  const selectedAreas = watch("serviceAreaIds") ?? [];

  function syncAvailability(days: string[], from: string, to: string, emergency: boolean) {
    setValue("availability", buildAvailabilityString(days, from, to, emergency));
  }

  function toggleDay(day: string) {
    const next = avDays.includes(day) ? avDays.filter((d) => d !== day) : [...avDays, day];
    setAvDays(next);
    syncAvailability(next, avFrom, avTo, avEmergency);
  }

  function applyPreset(preset: typeof PRESETS[number]) {
    setAvDays(preset.days);
    setAvFrom(preset.from);
    setAvTo(preset.to);
    syncAvailability(preset.days, preset.from, preset.to, avEmergency);
  }

  function handleFromChange(from: string) {
    setAvFrom(from);
    syncAvailability(avDays, from, avTo, avEmergency);
  }

  function handleToChange(to: string) {
    setAvTo(to);
    syncAvailability(avDays, avFrom, to, avEmergency);
  }

  function handleEmergencyChange(checked: boolean) {
    setAvEmergency(checked);
    syncAvailability(avDays, avFrom, avTo, checked);
  }

  function toggleLanguage(lang: string) {
    if (selectedLanguages.includes(lang)) {
      setValue("languages", selectedLanguages.filter((l) => l !== lang));
    } else {
      setValue("languages", [...selectedLanguages, lang]);
    }
  }

  function toggleArea(id: string) {
    if (selectedAreas.includes(id)) {
      setValue("serviceAreaIds", selectedAreas.filter((a) => a !== id));
    } else {
      setValue("serviceAreaIds", [...selectedAreas, id]);
    }
  }

  async function onSubmit(data: FormData) {
    try {
      setStatus("idle");
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((v) => formData.append(key, v));
        } else if (value !== undefined && value !== "") {
          formData.append(key, String(value));
        }
      });
      if (photoFile) formData.append("photo", photoFile);
      if (logoFile) formData.append("logo", logoFile);
      await submitProfessionalApplication(formData);
      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-8 text-center">
        <div className="text-4xl mb-3">🎉</div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Application Submitted!</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Your application has been submitted for review. You'll be notified once it's approved.
        </p>
        <Button onClick={() => router.push("/dashboard")} className="bg-green-600 hover:bg-green-700 text-white">
          Go to Dashboard
        </Button>
      </div>
    );
  }

  const selectClass = "border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-full";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-6 shadow-sm">

      {/* Profile photo */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div
            onClick={() => photoInputRef.current?.click()}
            className="h-24 w-24 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-pointer overflow-hidden bg-gray-50 dark:bg-gray-800 hover:border-green-400 transition-colors"
          >
            {photoPreview ? (
              <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
            ) : (
              <Camera className="h-7 w-7 text-gray-400" />
            )}
          </div>
          {photoPreview && (
            <button
              type="button"
              onClick={removePhoto}
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <div className="text-center">
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            className="text-sm text-green-700 dark:text-green-400 font-medium hover:underline"
          >
            {photoPreview ? "Change photo" : "Upload profile photo"}
          </button>
          <p className="text-xs text-gray-400 mt-0.5">Optional · JPG, PNG or WebP · Max 5 MB</p>
        </div>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handlePhotoChange}
          className="hidden"
        />
      </div>

      {/* Business logo */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
        <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Business Logo <span className="text-gray-400 font-normal">(optional)</span></p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          If you become a sponsored listing, your logo will appear in a carousel on the homepage. Square logos work best (e.g. 400×400 px).
        </p>
        <div className="flex items-center gap-4">
          <div
            onClick={() => logoInputRef.current?.click()}
            className="h-16 w-16 flex-shrink-0 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-pointer overflow-hidden bg-gray-50 dark:bg-gray-800 hover:border-green-400 transition-colors"
          >
            {logoPreview ? (
              <img src={logoPreview} alt="Logo preview" className="h-full w-full object-contain p-1" />
            ) : (
              <Building2 className="h-6 w-6 text-gray-400" />
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <button type="button" onClick={() => logoInputRef.current?.click()}
              className="text-sm text-green-700 dark:text-green-400 font-medium hover:underline text-left">
              {logoPreview ? "Change logo" : "Upload logo"}
            </button>
            {logoPreview && (
              <button type="button" onClick={removeLogo}
                className="text-xs text-red-500 hover:underline text-left">
                Remove
              </button>
            )}
            <p className="text-xs text-gray-400">JPG, PNG or WebP · Max 5 MB</p>
          </div>
        </div>
        <input ref={logoInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleLogoChange} className="hidden" />
      </div>

      {/* Mosque Affiliation */}
      <div className="border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl p-4">
        <Label className="text-emerald-800 dark:text-emerald-300 font-semibold">Mosque Affiliation *</Label>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-3">
          Select the mosque you are affiliated with. Affiliation means you are an active member of that mosque&apos;s community — for example, a member of their WhatsApp group or regular attendee.
        </p>
        <select {...register("mosqueId")} className={`${selectClass}`}>
          <option value="">Select your mosque…</option>
          {mosques.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}{m.city ? ` — ${m.city}` : ""}
            </option>
          ))}
          <option value="unlisted">My mosque is not listed</option>
        </select>
        {errors.mosqueId && <p className="text-xs text-red-600 mt-1">{errors.mosqueId.message}</p>}
        <p className="text-xs text-gray-400 mt-2">
          An admin will verify your affiliation via the mosque&apos;s community channel before approving your listing.
          If your mosque is not listed, your profile can still be approved — the affiliation badge will not be shown until your mosque is onboarded.
        </p>
      </div>

      {/* Category */}
      <div>
        <Label>Category *</Label>
        <select {...register("categoryId")} className={`mt-1.5 ${selectClass}`}>
          <option value="">Select your profession…</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
        {errors.categoryId && <p className="text-xs text-red-600 mt-1">{errors.categoryId.message}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Job Title *</Label>
          <Input id="title" {...register("title")} className="mt-1.5" placeholder="e.g. Licensed Electrician" />
          {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title.message}</p>}
        </div>
        <div>
          <Label htmlFor="businessName">Business Name (optional)</Label>
          <Input id="businessName" {...register("businessName")} className="mt-1.5" placeholder="e.g. Khan Electric Inc." />
        </div>
      </div>

      <div>
        <Label htmlFor="bio">Bio / About *</Label>
        <Textarea id="bio" {...register("bio")} className="mt-1.5 resize-none" rows={4}
          placeholder="Describe your experience, expertise, and what makes you a trusted professional…" />
        {errors.bio && <p className="text-xs text-red-600 mt-1">{errors.bio.message}</p>}
      </div>

      <div>
        <Label htmlFor="yearsOfExperience">Years of Experience</Label>
        <Input id="yearsOfExperience" type="number" min="0" {...register("yearsOfExperience")} className="mt-1.5 w-40" placeholder="e.g. 10" />
      </div>

      {/* Availability Picker */}
      <div>
        <Label>Availability</Label>
        <div className="mt-2 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-4">

          {/* Presets */}
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium uppercase tracking-wide">Quick Presets</p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="text-xs px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-green-500 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Days */}
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium uppercase tracking-wide">Days</p>
            <div className="flex gap-1.5 flex-wrap">
              {DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`w-11 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    avDays.includes(day)
                      ? "bg-green-600 text-white border-green-600"
                      : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-green-400"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Time range */}
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium uppercase tracking-wide">Hours</p>
            <div className="flex items-center gap-3">
              <select
                value={avFrom}
                onChange={(e) => handleFromChange(e.target.value)}
                className={selectClass}
                style={{ width: "140px" }}
              >
                {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <span className="text-sm text-gray-400 flex-shrink-0">to</span>
              <select
                value={avTo}
                onChange={(e) => handleToChange(e.target.value)}
                className={selectClass}
                style={{ width: "140px" }}
              >
                {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Emergency option */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={avEmergency}
              onChange={(e) => handleEmergencyChange(e.target.checked)}
              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">Emergency calls available 24/7</span>
          </label>

          {/* Preview */}
          {avDays.length > 0 && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-2">
              <p className="text-xs text-gray-400 mb-0.5">Preview</p>
              <p className="text-sm text-green-800 dark:text-green-300 font-medium">
                {buildAvailabilityString(avDays, avFrom, avTo, avEmergency)}
              </p>
            </div>
          )}
        </div>
        <input type="hidden" {...register("availability")} />
      </div>

      <div>
        <Label htmlFor="qualifications">Qualifications</Label>
        <Textarea id="qualifications" {...register("qualifications")} className="mt-1.5 resize-none" rows={2}
          placeholder="List your relevant qualifications, certifications, degrees…" />
      </div>

      <div>
        <Label htmlFor="licenses">Licenses & Registrations</Label>
        <Textarea id="licenses" {...register("licenses")} className="mt-1.5 resize-none" rows={2}
          placeholder="List any professional licenses or regulatory registrations…" />
      </div>

      {/* Languages */}
      <div>
        <Label>Languages Spoken *</Label>
        {errors.languages && <p className="text-xs text-red-600 mt-1">{errors.languages.message}</p>}
        <div className="mt-2 flex flex-wrap gap-2">
          {LANGUAGES.map((lang) => (
            <button key={lang} type="button" onClick={() => toggleLanguage(lang)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                selectedLanguages.includes(lang)
                  ? "bg-green-600 text-white border-green-600"
                  : "border-gray-300 text-gray-700 dark:border-gray-700 dark:text-gray-300 hover:border-green-400"
              }`}>
              {lang}
            </button>
          ))}
        </div>
      </div>

      {/* Service areas */}
      <div>
        <Label>Service Areas *</Label>
        {errors.serviceAreaIds && <p className="text-xs text-red-600 mt-1">{errors.serviceAreaIds.message}</p>}
        <div className="mt-2 flex flex-wrap gap-2">
          {serviceAreas.map((area) => (
            <button key={area.id} type="button" onClick={() => toggleArea(area.id)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                selectedAreas.includes(area.id)
                  ? "bg-green-600 text-white border-green-600"
                  : "border-gray-300 text-gray-700 dark:border-gray-700 dark:text-gray-300 hover:border-green-400"
              }`}>
              {area.name}
            </button>
          ))}
        </div>
      </div>

      {/* Contact info */}
      <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
        <h3 className="font-medium text-gray-900 dark:text-white mb-4 text-sm">Contact Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" type="tel" {...register("phone")} className="mt-1.5" placeholder="+1 416 555 0000" />
          </div>
          <div>
            <Label htmlFor="email">Business Email</Label>
            <Input id="email" type="email" {...register("email")} className="mt-1.5" placeholder="business@example.com" />
          </div>
          <div>
            <Label htmlFor="whatsapp">WhatsApp Number</Label>
            <Input id="whatsapp" type="tel" {...register("whatsapp")} className="mt-1.5" placeholder="+1 416 555 0000" />
          </div>
          <div>
            <Label htmlFor="website">Website</Label>
            <Input id="website" type="url" {...register("website")} className="mt-1.5" placeholder="https://yoursite.com" />
          </div>
        </div>
      </div>

      {status === "error" && (
        <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
          {errorMsg}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full bg-green-600 hover:bg-green-700 text-white h-11 text-base">
        {isSubmitting ? "Submitting Application…" : "Submit Application"}
      </Button>

      <p className="text-xs text-center text-gray-400">
        Your application will be reviewed by our administration. You'll be notified once approved.
      </p>
    </form>
  );
}
