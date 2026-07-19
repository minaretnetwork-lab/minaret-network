"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LANGUAGES } from "@/lib/constants";
import { useRouter } from "next/navigation";
import { Camera, X, Building2, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { PhoneInput } from "@/components/ui/phone-input";

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
interface Mosque { id: string; name: string; city?: string | null }
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

type DaySchedule = { from: string; to: string };

function buildAvailabilityString(schedules: Record<string, DaySchedule>, emergency: boolean) {
  const ordered = DAYS.filter((d) => d in schedules);
  if (ordered.length === 0) return "";
  // Group consecutive days that share the same hours
  const groups: { days: string[]; from: string; to: string }[] = [];
  for (const day of ordered) {
    const { from, to } = schedules[day];
    const last = groups[groups.length - 1];
    if (last && last.from === from && last.to === to) {
      last.days.push(day);
    } else {
      groups.push({ days: [day], from, to });
    }
  }
  const parts = groups.map(({ days, from, to }) => {
    const label = days.length === 1 ? days[0] : `${days[0]}–${days[days.length - 1]}`;
    return `${label}: ${from}–${to}`;
  });
  return parts.join(", ") + (emergency ? ". Emergency calls available 24/7." : "");
}

const STEPS = [
  { label: "Profile", description: "Your identity" },
  { label: "About", description: "Background & credentials" },
  { label: "Where & When", description: "Areas & availability" },
  { label: "Contact", description: "How to reach you" },
];

// Fields that must pass validation before each step's "Next"
const STEP_FIELDS: (keyof FormData)[][] = [
  ["categoryId", "title"],
  ["bio"],
  ["serviceAreaIds", "languages"],
  [],
];

export function ProfessionalRegistrationForm({ mosques, categories, serviceAreas }: Props) {
  const [step, setStep] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const goNextPending = useRef(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [avSchedules, setAvSchedules] = useState<Record<string, DaySchedule>>({});
  const [avEmergency, setAvEmergency] = useState(false);
  // category combobox
  const [catSearch, setCatSearch] = useState("");
  const [catOpen, setCatOpen] = useState(false);
  const catRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (catRef.current && !catRef.current.contains(e.target as Node)) setCatOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const router = useRouter();

  const { register, handleSubmit, watch, setValue, trigger, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { languages: [], serviceAreaIds: [] },
  });

  const selectedLanguages = watch("languages") ?? [];
  const selectedAreas = watch("serviceAreaIds") ?? [];

  function syncAvailability(schedules: Record<string, DaySchedule>, emergency: boolean) {
    setValue("availability", buildAvailabilityString(schedules, emergency));
  }
  function toggleDay(day: string) {
    setAvSchedules((prev) => {
      const next = { ...prev };
      if (day in next) { delete next[day]; } else { next[day] = { from: "9:00 AM", to: "5:00 PM" }; }
      syncAvailability(next, avEmergency);
      return next;
    });
  }
  function updateDayHours(day: string, field: "from" | "to", value: string) {
    setAvSchedules((prev) => {
      const next = { ...prev, [day]: { ...prev[day], [field]: value } };
      syncAvailability(next, avEmergency);
      return next;
    });
  }
  function applyPreset(p: typeof PRESETS[number]) {
    const next: Record<string, DaySchedule> = {};
    p.days.forEach((d) => { next[d] = { from: p.from, to: p.to }; });
    setAvSchedules(next);
    syncAvailability(next, avEmergency);
  }
  function toggleLanguage(lang: string) {
    setValue("languages", selectedLanguages.includes(lang)
      ? selectedLanguages.filter((l) => l !== lang)
      : [...selectedLanguages, lang]);
  }
  function toggleArea(id: string) {
    setValue("serviceAreaIds", selectedAreas.includes(id)
      ? selectedAreas.filter((a) => a !== id)
      : [...selectedAreas, id]);
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("Image must be under 5 MB."); return; }
    setPhotoFile(file); setPhotoPreview(URL.createObjectURL(file));
  }
  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("Logo must be under 5 MB."); return; }
    setLogoFile(file); setLogoPreview(URL.createObjectURL(file));
  }

  function lockAndScroll(changeFn: () => void) {
    setTransitioning(true);
    changeFn();
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => setTransitioning(false), 700);
  }

  async function goNext() {
    if (transitioning || goNextPending.current || step >= STEPS.length - 1) return;
    goNextPending.current = true;
    try {
      const fields = STEP_FIELDS[step];
      const valid = fields.length === 0 || await trigger(fields);
      if (valid) lockAndScroll(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)));
    } finally {
      goNextPending.current = false;
    }
  }
  function goBack() {
    if (transitioning) return;
    lockAndScroll(() => setStep((s) => s - 1));
  }

  async function onSubmit(data: FormData) {
    setSubmitStatus("idle");
    try {
      const fd = new window.FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (Array.isArray(value)) value.forEach((v) => fd.append(key, v));
        else if (value !== undefined && value !== "") fd.append(key, String(value));
      });
      if (photoFile) fd.append("photo", photoFile);
      if (logoFile) fd.append("logo", logoFile);
      const res = await fetch("/api/professionals/apply", { method: "POST", body: fd });
      const result: { ok: boolean; error?: string } = await res.json();
      if (!result.ok) {
        setErrorMsg(result.error ?? "Something went wrong. Please try again.");
        setSubmitStatus("error");
      } else {
        setSubmitStatus("success");
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setSubmitStatus("error");
    }
  }

  if (submitStatus === "success") {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-10 text-center shadow-sm">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Application Submitted!</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
          Your application has been sent for review. You'll be notified once it's approved by our admin team.
        </p>
        <Button onClick={() => router.push("/dashboard")} className="bg-green-600 hover:bg-green-700 text-white">
          Go to Dashboard
        </Button>
      </div>
    );
  }

  const selectClass = "border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-full";

  return (
    <div className="space-y-6">

      {/* ── Step indicator ── */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <div key={s.label} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                    done ? "bg-green-600 text-white" :
                    active ? "bg-green-600 text-white ring-4 ring-green-100 dark:ring-green-900/40" :
                    "bg-gray-100 dark:bg-gray-800 text-gray-400"
                  }`}>
                    {done ? <Check className="h-4 w-4" /> : i + 1}
                  </div>
                  <span className={`mt-1.5 text-xs font-medium hidden sm:block ${
                    active ? "text-green-700 dark:text-green-400" : done ? "text-gray-500" : "text-gray-400"
                  }`}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 transition-colors ${done ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"}`} />
                )}
              </div>
            );
          })}
        </div>
        <p className="text-center text-xs text-gray-400 mt-3">
          Step {step + 1} of {STEPS.length} — {STEPS[step].description}
        </p>
      </div>

      {/* ── Step content ── */}
      <form onSubmit={(e) => {
        e.preventDefault();
        if (step !== STEPS.length - 1) return;
        handleSubmit(onSubmit, () => {
          setErrorMsg("Some required fields need attention. Please go back and review your application.");
          setSubmitStatus("error");
        })(e);
      }}>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-6">

          {/* ─── STEP 1: Profile ─── */}
          {step === 0 && (
            <>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-0.5">Your profile</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Start with the basics — your photo and what you do.</p>
              </div>

              {/* Photo */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div
                    onClick={() => photoInputRef.current?.click()}
                    className="h-24 w-24 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-pointer overflow-hidden bg-gray-50 dark:bg-gray-800 hover:border-green-400 transition-colors"
                  >
                    {photoPreview
                      ? <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                      : <Camera className="h-7 w-7 text-gray-400" />}
                  </div>
                  {photoPreview && (
                    <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreview(null); if (photoInputRef.current) photoInputRef.current.value = ""; }}
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <div className="text-center">
                  <button type="button" onClick={() => photoInputRef.current?.click()}
                    className="text-sm text-green-700 dark:text-green-400 font-medium hover:underline">
                    {photoPreview ? "Change photo" : "Upload profile photo"}
                  </button>
                  <p className="text-xs text-gray-400 mt-0.5">Optional · JPG, PNG or WebP · Max 5 MB</p>
                </div>
                <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} className="hidden" />
              </div>

              {/* Category — searchable combobox */}
              <div>
                <Label>Profession / Category *</Label>
                <div ref={catRef} className="relative mt-1.5">
                  {(() => {
                    const selectedCat = categories.find((c) => c.id === watch("categoryId"));
                    const filtered = catSearch
                      ? categories.filter((c) => c.name.toLowerCase().includes(catSearch.toLowerCase()))
                      : categories;
                    return (
                      <>
                        <div className="relative">
                          <input
                            type="text"
                            value={catSearch !== "" ? catSearch : selectedCat ? `${selectedCat.icon ?? ""} ${selectedCat.name}`.trim() : ""}
                            onChange={(e) => { setCatSearch(e.target.value); setValue("categoryId", ""); setCatOpen(true); }}
                            onFocus={() => setCatOpen(true)}
                            placeholder="Search profession…"
                            autoComplete="off"
                            className={`${selectClass} pr-8`}
                          />
                          {(selectedCat || catSearch) && (
                            <button type="button" onClick={() => { setCatSearch(""); setValue("categoryId", ""); setCatOpen(false); }}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        {catOpen && filtered.length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-y-auto max-h-52">
                            {filtered.map((c) => (
                              <button key={c.id} type="button"
                                onMouseDown={(e) => { e.preventDefault(); setValue("categoryId", c.id); setCatSearch(""); setCatOpen(false); }}
                                className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors ${c.id === watch("categoryId") ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 font-medium" : "text-gray-800 dark:text-gray-200"}`}>
                                <span>{c.icon}</span><span>{c.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
                {errors.categoryId && <p className="text-xs text-red-600 mt-1">{errors.categoryId.message}</p>}
                {(() => { const sel = categories.find((c) => c.id === watch("categoryId")); return sel?.slug === "other" ? (
                  <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 mt-2">
                    Great — use the <strong>Job Title</strong> field below to describe your specific profession (e.g. Solar Panel Installer, Sign Language Interpreter).
                  </p>
                ) : null; })()}
              </div>

              {/* Title + Business name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Job Title *</Label>
                  <Input id="title" {...register("title")} className="mt-1.5"
                    placeholder={(() => { const sel = categories.find((c) => c.id === watch("categoryId")); return sel?.slug === "other" ? "Describe your profession…" : "e.g. Licensed Electrician"; })()} />
                  {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title.message}</p>}
                </div>
                <div>
                  <Label htmlFor="businessName">Business Name <span className="text-gray-400 font-normal">(optional)</span></Label>
                  <Input id="businessName" {...register("businessName")} className="mt-1.5" placeholder="e.g. Khan Electric Inc." />
                </div>
              </div>
            </>
          )}

          {/* ─── STEP 2: About ─── */}
          {step === 1 && (
            <>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-0.5">About you</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Help the community understand your background and expertise.</p>
              </div>

              <div>
                <Label htmlFor="bio">Bio / About *</Label>
                <Textarea id="bio" {...register("bio")} className="mt-1.5 resize-none" rows={5}
                  placeholder="Describe your experience, expertise, and what makes you a trusted professional in the community…" />
                {errors.bio && <p className="text-xs text-red-600 mt-1">{errors.bio.message}</p>}
                <p className="text-xs text-gray-400 mt-1">Minimum 50 characters · {watch("bio")?.length ?? 0}/1000</p>
              </div>

              <div>
                <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                <Input id="yearsOfExperience" type="number" min="0" {...register("yearsOfExperience")} className="mt-1.5 w-full sm:w-40" placeholder="e.g. 10" />
              </div>

              <div>
                <Label htmlFor="qualifications">Qualifications <span className="text-gray-400 font-normal">(optional)</span></Label>
                <Textarea id="qualifications" {...register("qualifications")} className="mt-1.5 resize-none" rows={2}
                  placeholder="Degrees, certifications, training…" />
              </div>

              <div>
                <Label htmlFor="licenses">Licenses & Registrations <span className="text-gray-400 font-normal">(optional)</span></Label>
                <Textarea id="licenses" {...register("licenses")} className="mt-1.5 resize-none" rows={2}
                  placeholder="Professional licenses or regulatory registrations…" />
              </div>
            </>
          )}

          {/* ─── STEP 3: Where & When ─── */}
          {step === 2 && (
            <>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-0.5">Where & when</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Tell the community where you work and your availability.</p>
              </div>

              {/* Service areas */}
              <div>
                <Label>Service Areas *</Label>
                <p className="text-xs text-gray-400 mt-0.5 mb-2">Select all areas you serve</p>
                {errors.serviceAreaIds && <p className="text-xs text-red-600 mb-1">{errors.serviceAreaIds.message}</p>}
                <div className="flex flex-wrap gap-2">
                  {serviceAreas.map((area) => (
                    <button key={area.id} type="button" onClick={() => toggleArea(area.id)}
                      className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                        selectedAreas.includes(area.id)
                          ? "bg-green-600 text-white border-green-600"
                          : "border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300 hover:border-green-400"
                      }`}>
                      {area.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Availability */}
              <div>
                <Label>Availability</Label>
                <div className="mt-2 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-4">
                  {/* Presets */}
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium uppercase tracking-wide">Quick Presets</p>
                    <div className="flex flex-wrap gap-2">
                      {PRESETS.map((preset) => (
                        <button key={preset.label} type="button" onClick={() => applyPreset(preset)}
                          className="text-xs px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-green-500 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Day toggles */}
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium uppercase tracking-wide">Days</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {DAYS.map((day) => (
                        <button key={day} type="button" onClick={() => toggleDay(day)}
                          className={`w-11 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                            day in avSchedules
                              ? "bg-green-600 text-white border-green-600"
                              : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-green-400"
                          }`}>
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Per-day hour rows */}
                  {DAYS.filter((d) => d in avSchedules).length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Hours per day</p>
                      {DAYS.filter((d) => d in avSchedules).map((day) => (
                        <div key={day} className="flex items-center gap-2">
                          <span className="w-9 text-xs font-semibold text-gray-600 dark:text-gray-400 flex-shrink-0">{day}</span>
                          <select value={avSchedules[day].from}
                            onChange={(e) => updateDayHours(day, "from", e.target.value)}
                            className={`${selectClass} flex-1 text-xs py-1.5`}>
                            {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <span className="text-xs text-gray-400 flex-shrink-0">to</span>
                          <select value={avSchedules[day].to}
                            onChange={(e) => updateDayHours(day, "to", e.target.value)}
                            className={`${selectClass} flex-1 text-xs py-1.5`}>
                            {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  )}
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={avEmergency}
                      onChange={(e) => { setAvEmergency(e.target.checked); syncAvailability(avSchedules, e.target.checked); }}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Emergency calls available 24/7</span>
                  </label>
                </div>
                <input type="hidden" {...register("availability")} />
              </div>

              {/* Languages */}
              <div>
                <Label>Languages Spoken *</Label>
                {errors.languages && <p className="text-xs text-red-600 mt-1 mb-1">{errors.languages.message}</p>}
                <div className="mt-2 flex flex-wrap gap-2">
                  {LANGUAGES.map((lang) => (
                    <button key={lang} type="button" onClick={() => toggleLanguage(lang)}
                      className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                        selectedLanguages.includes(lang)
                          ? "bg-green-600 text-white border-green-600"
                          : "border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300 hover:border-green-400"
                      }`}>
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ─── STEP 4: Contact & Mosque ─── */}
          {step === 3 && (
            <>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-0.5">Contact & affiliation</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">How should people reach you, and which mosque are you affiliated with?</p>
              </div>

              {/* Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <div className="mt-1.5">
                    <PhoneInput id="phone" value={watch("phone") ?? ""} onChange={(val) => setValue("phone", val)} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <div className="mt-1.5">
                    <PhoneInput value={watch("whatsapp") ?? ""} onChange={(val) => setValue("whatsapp", val)} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Business Email</Label>
                  <Input id="email" type="email" {...register("email")} className="mt-1.5" placeholder="business@example.com" />
                  {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" type="url" {...register("website")} className="mt-1.5" placeholder="https://yoursite.com" />
                  {errors.website && <p className="text-xs text-red-600 mt-1">{errors.website.message}</p>}
                </div>
              </div>

              {/* Mosque */}
              <div className="border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl p-4">
                <Label className="text-emerald-800 dark:text-emerald-300 font-semibold">Mosque Affiliation</Label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-3">
                  Select the mosque you are affiliated with — an active member of their community channel or regular attendee.
                </p>
                <select {...register("mosqueId")} className={selectClass}>
                  <option value="">Select your mosque…</option>
                  {mosques.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}{m.city ? ` — ${m.city}` : ""}</option>
                  ))}
                  <option value="unlisted">My mosque is not listed</option>
                </select>
                <p className="text-xs text-gray-400 mt-2">
                  An admin will verify your affiliation before approving your listing. If your mosque isn't listed, your profile can still be approved — the affiliation badge will not appear until your mosque is onboarded.
                </p>
              </div>

              {/* Business logo */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Business Logo <span className="text-gray-400 font-normal">(optional)</span></p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Your logo appears on your Featured Business card and in the Sponsored carousel on the homepage. Square logos work best (e.g. 400×400 px).
                </p>
                <div className="flex items-center gap-4">
                  <div onClick={() => logoInputRef.current?.click()}
                    className="h-16 w-16 flex-shrink-0 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-pointer overflow-hidden bg-gray-50 dark:bg-gray-800 hover:border-green-400 transition-colors">
                    {logoPreview
                      ? <img src={logoPreview} alt="Logo" className="h-full w-full object-contain p-1" />
                      : <Building2 className="h-6 w-6 text-gray-400" />}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <button type="button" onClick={() => logoInputRef.current?.click()}
                      className="text-sm text-green-700 dark:text-green-400 font-medium hover:underline text-left">
                      {logoPreview ? "Change logo" : "Upload logo"}
                    </button>
                    {logoPreview && (
                      <button type="button" onClick={() => { setLogoFile(null); setLogoPreview(null); if (logoInputRef.current) logoInputRef.current.value = ""; }}
                        className="text-xs text-red-500 hover:underline text-left">Remove</button>
                    )}
                    <p className="text-xs text-gray-400">JPG, PNG or WebP · Max 5 MB</p>
                  </div>
                </div>
                <input ref={logoInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleLogoChange} className="hidden" />
              </div>

              {/* Disclaimer + Terms */}
              <div className="border border-amber-100 dark:border-amber-900/30 bg-amber-50/60 dark:bg-amber-900/10 rounded-xl p-4 space-y-3">
                <p className="text-xs text-amber-900 dark:text-amber-300 font-semibold uppercase tracking-wide">Before you submit</p>
                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1.5 list-disc list-inside">
                  <li>Minaret Network does <strong>not</strong> verify credentials, licenses, or professional qualifications.</li>
                  <li>We are not liable for the quality, safety, or outcome of any services provided through this directory.</li>
                  <li>Your listing may be removed at any time if it violates our community guidelines.</li>
                  <li>By submitting, you confirm that all information provided is accurate and truthful.</li>
                </ul>
                <label className="flex items-start gap-2.5 cursor-pointer select-none pt-1">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 flex-shrink-0 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    I have read and agree to the above. I understand that Minaret Network is a community directory and not a professional verification service.
                  </span>
                </label>
              </div>

              {submitStatus === "error" && (
                <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                  {errorMsg}
                </p>
              )}
            </>
          )}
        </div>

        {/* ── Navigation ── */}
        <div className={`flex items-center justify-between mt-4 transition-opacity duration-200 ${transitioning ? "opacity-40 pointer-events-none" : ""}`}>
          {step > 0 ? (
            <Button type="button" variant="outline" onClick={goBack} disabled={transitioning} className="gap-1.5">
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
          ) : <div />}

          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={goNext} disabled={transitioning} className="bg-green-600 hover:bg-green-700 text-white gap-1.5 px-6">
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={isSubmitting || transitioning || !termsAccepted}
              title={!termsAccepted ? "Please accept the terms above to submit" : undefined}
              className="bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 text-white min-w-[180px] h-11 text-base font-semibold shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? "Submitting…" : "Submit Application"}
            </Button>
          )}
        </div>

        <p className="text-xs text-center text-gray-400 mt-3">
          Your application will be reviewed by our admin team before going live.
        </p>
      </form>
    </div>
  );
}
