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
import { CategoryIcon } from "@/components/ui/category-icon";
import { useRouter } from "next/navigation";
import { Camera, X, Building2, ChevronRight, ChevronLeft, Check, Lightbulb } from "lucide-react";
import { PhoneInput } from "@/components/ui/phone-input";
import { submitCategorySuggestion } from "@/lib/actions/category-suggestions";
import { IMAGE_UPLOAD_LIMIT_BYTES, isAcceptedUploadImageType } from "@/lib/upload-image-config";

const BIO_MIN_LENGTH = 50;
const BIO_MAX_LENGTH = 1000;

function normalizeUrl(v: string | undefined): string | undefined {
  if (!v) return v;
  const t = v.trim();
  if (!t) return t;
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

function isValidUrl(v: string): boolean {
  if (!v) return true;
  try { new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`); return true; } catch { return false; }
}

const urlField = (msg = "Enter a valid URL") =>
  z.string().refine(v => !v || isValidUrl(v.trim()), msg).optional().or(z.literal(""));

const schema = z.object({
  mosqueId: z.string().optional(),
  mosqueSuggestionName: z.string().optional(),
  mosqueSuggestionCity: z.string().optional(),
  mosqueSuggestionAddress: z.string().optional(),
  mosqueSuggestionWebsite: urlField("Enter a valid website URL"),
  mosqueSuggestionChannelName: z.string().optional(),
  mosqueSuggestionChannelLink: urlField("Enter a valid community link"),
  mosqueSuggestionNotes: z.string().optional(),
  categoryId: z.string().optional(),
  categoryIds: z.array(z.string()).min(1, "Please select at least one category"),
  businessName: z.string().optional(),
  title: z.string().min(2, "Job title is required"),
  bio: z.string().min(BIO_MIN_LENGTH, `Please write at least ${BIO_MIN_LENGTH} characters`).max(BIO_MAX_LENGTH),
  yearsOfExperience: z.string().optional(),
  qualifications: z.string().optional(),
  licenses: z.string().optional(),
  languages: z.array(z.string()).min(1, "Select at least one language"),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: urlField(),
  whatsapp: z.string().optional(),
  whatsappSameAsPhone: z.boolean().optional(),
  businessAddress: z.string().optional(),
  acceptsWalkIns: z.boolean().optional(),
  availability: z.string().optional(),
  serviceAreaIds: z.array(z.string()).min(1, "Select at least one service area"),
}).superRefine((data, ctx) => {
  if (data.mosqueId === "unlisted" && !data.mosqueSuggestionName?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["mosqueSuggestionName"],
      message: "Please enter the mosque name so admins can review it.",
    });
  }
});

type FormData = z.infer<typeof schema>;

interface Category { id: string; name: string; slug: string; icon?: string | null }
interface ServiceArea { id: string; name: string }
interface Mosque { id: string; name: string; city?: string | null }
export interface ProfessionalFormInitialData {
  id: string;
  mosqueId: string | null;
  categoryId: string;
  categoryIds?: string[];
  categories?: { id: string }[];
  businessName: string | null;
  title: string | null;
  bio: string | null;
  yearsOfExperience: number | null;
  qualifications: string | null;
  licenses: string | null;
  languages: string[];
  phone: string | null;
  email: string | null;
  website: string | null;
  whatsapp: string | null;
  businessAddress: string | null;
  acceptsWalkIns: boolean;
  availability: string | null;
  photoUrl: string | null;
  logoUrl: string | null;
  serviceAreas: { id: string }[];
}
interface Props {
  mosques: Mosque[];
  categories: Category[];
  serviceAreas: ServiceArea[];
  initialData?: ProfessionalFormInitialData | null;
  mode?: "create" | "edit";
  onSubmitted?: () => void;
}

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
type AddressSuggestion = {
  label: string;
  address: string;
  city: string | null;
  province: string | null;
};

function timeToMinutes(value: string) {
  const match = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const period = match[3].toUpperCase();
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  const normalizedHour = (hour % 12) + (period === "PM" ? 12 : 0);
  return normalizedHour * 60 + minute;
}

function getInvalidAvailabilityDays(schedules: Record<string, DaySchedule>) {
  return DAYS.filter((day) => {
    const schedule = schedules[day];
    if (!schedule) return false;
    const start = timeToMinutes(schedule.from);
    const end = timeToMinutes(schedule.to);
    return start === null || end === null || end <= start;
  });
}

function validateSelectedUpload(file: File, label: string) {
  if (!file || file.size <= 0) {
    throw new Error(`${label} is empty. Please choose an image and try again.`);
  }

  if (!file.type || !file.type.startsWith("image/")) {
    throw new Error(`${label} must be an image file.`);
  }

  if (!isAcceptedUploadImageType(file.type)) {
    throw new Error(`${label} must be a phone or web image such as JPG, PNG, WebP, HEIC, HEIF, or AVIF.`);
  }

  if (file.size > IMAGE_UPLOAD_LIMIT_BYTES) {
    throw new Error(`${label} is too large to upload. Please choose an image under 40 MB.`);
  }
}

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
  ["categoryIds", "title"],
  ["bio"],
  ["serviceAreaIds", "languages"],
  [],
];

export function ProfessionalRegistrationForm({ mosques, categories, serviceAreas, initialData = null, mode = "create", onSubmitted }: Props) {
  const isEdit = mode === "edit" && initialData;
  const [step, setStep] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(initialData?.photoUrl ?? null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(initialData?.logoUrl ?? null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const goNextPending = useRef(false);
  const [termsAccepted, setTermsAccepted] = useState(Boolean(isEdit));
  const [affiliationConsent, setAffiliationConsent] = useState(Boolean(isEdit));

  const [avSchedules, setAvSchedules] = useState<Record<string, DaySchedule>>({});
  const [avEmergency, setAvEmergency] = useState(false);
  // category combobox
  const [catSearch, setCatSearch] = useState("");
  const [catOpen, setCatOpen] = useState(false);
  const [areaSearch, setAreaSearch] = useState("");
  const catRef = useRef<HTMLDivElement>(null);
  const addressRef = useRef<HTMLDivElement>(null);
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [addressLookupOpen, setAddressLookupOpen] = useState(false);
  const [addressLookupLoading, setAddressLookupLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
  const whatsappInitiallySameAsPhone = Boolean(initialData?.phone && initialData.phone === initialData?.whatsapp);
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (catRef.current && !catRef.current.contains(e.target as Node)) setCatOpen(false);
      if (addressRef.current && !addressRef.current.contains(e.target as Node)) setAddressLookupOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const router = useRouter();

  const { register, handleSubmit, watch, setValue, trigger, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      mosqueId: initialData?.mosqueId ?? "",
      categoryId: initialData?.categoryId ?? "",
      categoryIds: initialData?.categoryIds?.length
        ? initialData.categoryIds
        : initialData?.categories?.length
        ? initialData.categories.map((category) => category.id)
        : initialData?.categoryId ? [initialData.categoryId] : [],
      businessName: initialData?.businessName ?? "",
      title: initialData?.title ?? "",
      bio: initialData?.bio ?? "",
      yearsOfExperience: initialData?.yearsOfExperience?.toString() ?? "",
      qualifications: initialData?.qualifications ?? "",
      licenses: initialData?.licenses ?? "",
      languages: initialData?.languages ?? [],
      phone: initialData?.phone ?? "",
      email: initialData?.email ?? "",
      website: initialData?.website ?? "",
      whatsapp: initialData?.whatsapp ?? "",
      whatsappSameAsPhone: whatsappInitiallySameAsPhone,
      businessAddress: initialData?.businessAddress ?? "",
      acceptsWalkIns: initialData?.acceptsWalkIns ?? false,
      availability: initialData?.availability ?? "",
      serviceAreaIds: initialData?.serviceAreas.map((area) => area.id) ?? [],
    },
  });

  const selectedLanguages = watch("languages") ?? [];
  const selectedAreas = watch("serviceAreaIds") ?? [];
  const selectedCategoryIds = watch("categoryIds") ?? [];
  const primaryCategoryId = selectedCategoryIds[0] ?? watch("categoryId") ?? "";
  const selectedMosqueId = watch("mosqueId");
  const phoneValue = watch("phone") ?? "";
  const whatsappSameAsPhone = watch("whatsappSameAsPhone") ?? false;
  const businessAddressValue = watch("businessAddress") ?? "";
  const bioLength = watch("bio")?.length ?? 0;
  const bioCharactersRemaining = Math.max(BIO_MIN_LENGTH - bioLength, 0);
  const normalizedAreaSearch = areaSearch.trim().toLowerCase();
  const visibleServiceAreas = normalizedAreaSearch
    ? serviceAreas.filter((area) => area.name.toLowerCase().includes(normalizedAreaSearch) || selectedAreas.includes(area.id))
    : serviceAreas;
  const invalidAvailabilityDays = getInvalidAvailabilityDays(avSchedules);

  useEffect(() => {
    const query = businessAddressValue.trim();
    if (query.length < 3) {
      setAddressSuggestions([]);
      setAddressLookupLoading(false);
      return;
    }

    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      setAddressLookupLoading(true);
      try {
        const response = await fetch(`/api/geocode/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error("Address lookup failed");
        const data = await response.json() as { suggestions?: AddressSuggestion[] };
        if (!cancelled) setAddressSuggestions(data.suggestions ?? []);
      } catch {
        if (!cancelled) setAddressSuggestions([]);
      } finally {
        if (!cancelled) setAddressLookupLoading(false);
      }
    }, 450);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [businessAddressValue]);

  function syncAvailability(schedules: Record<string, DaySchedule>, emergency: boolean) {
    if (getInvalidAvailabilityDays(schedules).length === 0) setAvailabilityError("");
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

  function addCategory(id: string) {
    if (!id) return;
    const next = selectedCategoryIds.includes(id) ? selectedCategoryIds : [...selectedCategoryIds, id];
    setValue("categoryIds", next, { shouldDirty: true, shouldValidate: true });
    setValue("categoryId", next[0] ?? "", { shouldDirty: true, shouldValidate: true });
  }

  function removeCategory(id: string) {
    const next = selectedCategoryIds.filter((categoryId) => categoryId !== id);
    setValue("categoryIds", next, { shouldDirty: true, shouldValidate: true });
    setValue("categoryId", next[0] ?? "", { shouldDirty: true, shouldValidate: true });
  }
  function selectAllServiceAreas() {
    setValue("serviceAreaIds", serviceAreas.map((area) => area.id), { shouldDirty: true, shouldValidate: true });
  }
  function clearServiceAreas() {
    setValue("serviceAreaIds", [], { shouldDirty: true, shouldValidate: true });
  }

  function handlePhoneValueChange(value: string) {
    setValue("phone", value);
    if (whatsappSameAsPhone) setValue("whatsapp", value);
  }

  function handleWhatsAppSameAsPhone(checked: boolean) {
    setValue("whatsappSameAsPhone", checked);
    if (checked) setValue("whatsapp", phoneValue);
  }

  function checkAspectRatio(file: File, type: "photo" | "logo"): Promise<void> {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        const ratio = img.width / img.height;
        if (type === "logo" && (ratio < 0.5 || ratio > 2)) {
          alert("Business logo should be roughly square (between 1:2 and 2:1 ratio). Please crop your image before uploading.");
        } else if (type === "photo" && ratio > 1.5) {
          alert("Profile photo should be portrait or square, not landscape. Please crop your image before uploading.");
        }
        resolve();
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(); };
      img.src = url;
    });
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      validateSelectedUpload(file, "Profile photo");
      await checkAspectRatio(file, "photo");
      setPhotoFile(file); setPhotoPreview(URL.createObjectURL(file));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not prepare that profile photo.");
    }
  }
  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      validateSelectedUpload(file, "Business logo");
      await checkAspectRatio(file, "logo");
      setLogoFile(file); setLogoPreview(URL.createObjectURL(file));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not prepare that business logo.");
    }
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
      if (step === 2 && invalidAvailabilityDays.length > 0) {
        setAvailabilityError(`End time must be after start time for ${invalidAvailabilityDays.join(", ")}.`);
        return;
      }
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
    const invalidDays = getInvalidAvailabilityDays(avSchedules);
    if (invalidDays.length > 0) {
      setAvailabilityError(`End time must be after start time for ${invalidDays.join(", ")}.`);
      setStep(2);
      return;
    }
    try {
      data.website = normalizeUrl(data.website as string | undefined);
      data.mosqueSuggestionWebsite = normalizeUrl(data.mosqueSuggestionWebsite as string | undefined);
      data.mosqueSuggestionChannelLink = normalizeUrl(data.mosqueSuggestionChannelLink as string | undefined);
      const fd = new window.FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (Array.isArray(value)) value.forEach((v) => fd.append(key, v));
        else if (value !== undefined && value !== "") fd.append(key, String(value));
      });
      if (photoFile) fd.append("photo", photoFile);
      if (logoFile) fd.append("logo", logoFile);
      if (initialData?.id) fd.append("professionalId", initialData.id);
      if (affiliationConsent) fd.append("mosqueAffiliationConsent", "true");
      const res = await fetch("/api/professionals/apply", { method: "POST", body: fd });
      const contentType = res.headers.get("content-type") ?? "";
      const result: { ok: boolean; error?: string } = contentType.includes("application/json")
        ? await res.json()
        : { ok: false, error: `The server returned an unexpected response (${res.status}). Please try again.` };
      if (!result.ok) {
        setErrorMsg(result.error ?? "Something went wrong. Please try again.");
        setSubmitStatus("error");
      } else {
        setSubmitStatus("success");
        onSubmitted?.();
      }
    } catch (err) {
      const message = err instanceof TypeError && err.message.toLowerCase().includes("fetch")
        ? "The upload did not reach the server. Please try again on a steadier connection, or remove/reselect the photo or logo and submit again."
        : err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setErrorMsg(message);
      setSubmitStatus("error");
    }
  }

  if (submitStatus === "success") {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-10 text-center shadow-sm">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {isEdit ? "Listing Updated!" : "Application Submitted!"}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
          {isEdit
            ? "Your changes have been saved and sent back for admin review."
            : "Your application has been sent for review. You'll be notified once it's approved by our admin team."}
        </p>
        <Button onClick={() => router.push("/dashboard/professional")} className="bg-green-600 hover:bg-green-700 text-white">
          Go to Listings
        </Button>
      </div>
    );
  }

  const selectClass = "border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-full";
  const businessAddressRegistration = register("businessAddress");

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
                  <p className="text-xs text-gray-400 mt-0.5">Optional · Max 40 MB · JPG, PNG, WebP, HEIC</p>
                  <p className="text-xs text-gray-400 mt-0.5">Best results: square or portrait crop · min 400×400 px · avoid wide/landscape photos</p>
                </div>
                <input ref={photoInputRef} type="file" accept="image/*,.heic,.heif,.avif" onChange={handlePhotoChange} className="hidden" />
              </div>

              {/* Categories — searchable multi-select combobox */}
              <div>
                <Label>Professions / Categories *</Label>
                <p className="mt-0.5 text-xs text-gray-400">Choose every category this listing should appear under. The first selected category is treated as primary.</p>
                <div ref={catRef} className="relative mt-1.5">
                  {(() => {
                    const filtered = catSearch
                      ? categories.filter((c) => c.name.toLowerCase().includes(catSearch.toLowerCase()) && !selectedCategoryIds.includes(c.id))
                      : categories;
                    const selectedCategories = selectedCategoryIds
                      .map((id) => categories.find((category) => category.id === id))
                      .filter((category): category is Category => Boolean(category));
                    return (
                      <>
                        <div className="relative">
                          <input
                            type="text"
                            value={catSearch}
                            onChange={(e) => { setCatSearch(e.target.value); setCatOpen(true); }}
                            onFocus={() => setCatOpen(true)}
                            placeholder={selectedCategories.length ? "Add another profession…" : "Search profession…"}
                            autoComplete="off"
                            className={`${selectClass} pr-8`}
                          />
                          {catSearch && (
                            <button type="button" onClick={() => { setCatSearch(""); setCatOpen(false); }}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        {selectedCategories.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {selectedCategories.map((category, index) => (
                              <button
                                key={category.id}
                                type="button"
                                onClick={() => removeCategory(category.id)}
                                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                              >
                                <CategoryIcon slug={category.slug} className="h-3.5 w-3.5" />
                                {category.name}
                                {index === 0 && <span className="text-[10px] uppercase tracking-wide text-emerald-600 dark:text-emerald-300">Primary</span>}
                                <X className="h-3 w-3" />
                              </button>
                            ))}
                          </div>
                        )}
                        {catOpen && filtered.length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-y-auto max-h-52">
                            {filtered.map((c) => (
                              <button key={c.id} type="button"
                                onMouseDown={(e) => { e.preventDefault(); addCategory(c.id); setCatSearch(""); setCatOpen(false); }}
                                className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors text-gray-800 dark:text-gray-200">
                                <CategoryIcon slug={c.slug} className="h-4 w-4 flex-shrink-0" /><span>{c.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
                {errors.categoryIds && <p className="text-xs text-red-600 mt-1">{errors.categoryIds.message}</p>}
              </div>
              <CategorySuggestionPanel categories={categories} selectedCategoryId={primaryCategoryId} />

              {/* Title + Business name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Job Title *</Label>
                  <Input id="title" {...register("title")} className="mt-1.5"
                    placeholder={(() => { const sel = categories.find((c) => c.id === primaryCategoryId); return sel?.slug === "other" ? "Describe your profession…" : "e.g. Licensed Electrician"; })()} />
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
                  placeholder="Describe your experience, expertise, and why you're a good fit for this community…" />
                <div className="mt-1.5 flex flex-col gap-0.5 text-xs sm:flex-row sm:items-center sm:justify-between">
                  {bioCharactersRemaining > 0 ? (
                    <p className="text-amber-700 dark:text-amber-300">
                      {bioCharactersRemaining} more character{bioCharactersRemaining === 1 ? "" : "s"} needed
                    </p>
                  ) : (
                    <p className="text-green-700 dark:text-green-300">Minimum met</p>
                  )}
                  <p className={bioLength > BIO_MAX_LENGTH ? "text-red-600" : "text-gray-400"}>
                    {bioLength}/{BIO_MAX_LENGTH} characters
                  </p>
                </div>
                {errors.bio && <p className="text-xs text-red-600 mt-1">{errors.bio.message}</p>}
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
                <Input
                  type="search"
                  value={areaSearch}
                  onChange={(event) => setAreaSearch(event.target.value)}
                  className="mb-2 max-w-sm"
                  placeholder="Type a city or area to filter..."
                />
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAllServiceAreas}
                    className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                  >
                    Select all GTA areas
                  </button>
                  <button
                    type="button"
                    onClick={clearServiceAreas}
                    className="rounded-full border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    Clear all
                  </button>
                  {selectedAreas.length > 0 && (
                    <span className="text-xs text-gray-400">
                      {selectedAreas.length} of {serviceAreas.length} selected
                    </span>
                  )}
                </div>
                {errors.serviceAreaIds && <p className="text-xs text-red-600 mb-1">{errors.serviceAreaIds.message}</p>}
                <div className="flex flex-wrap gap-2">
                  {visibleServiceAreas.map((area) => (
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
                {visibleServiceAreas.length === 0 && (
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No service areas match that search.</p>
                )}
              </div>

              <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                <Label htmlFor="businessAddress">Main business address <span className="font-normal text-gray-400">(optional)</span></Label>
                <p className="mt-0.5 text-xs text-gray-400">
                  Add this if clients can visit your office, clinic, shop, or storefront. Leave it blank if you work from home or travel to clients.
                </p>
                <div ref={addressRef} className="relative mt-2">
                  <Input
                    id="businessAddress"
                    name={businessAddressRegistration.name}
                    ref={businessAddressRegistration.ref}
                    onBlur={businessAddressRegistration.onBlur}
                    value={businessAddressValue}
                    onChange={(event) => {
                      setValue("businessAddress", event.target.value, { shouldDirty: true, shouldValidate: false });
                      setAddressLookupOpen(true);
                    }}
                    onFocus={() => setAddressLookupOpen(true)}
                    autoComplete="street-address"
                    placeholder="Start typing an address, e.g. 123 Main St, Newmarket"
                  />
                  {addressLookupOpen && businessAddressValue.trim().length >= 3 && (
                    <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-auto rounded-xl border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-gray-900">
                      {addressLookupLoading ? (
                        <p className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">Looking up addresses…</p>
                      ) : addressSuggestions.length > 0 ? (
                        addressSuggestions.map((suggestion) => (
                          <button
                            key={`${suggestion.address}-${suggestion.label}`}
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => {
                              setValue("businessAddress", suggestion.address, { shouldDirty: true, shouldValidate: true });
                              setAddressLookupOpen(false);
                            }}
                            className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-emerald-50 focus:bg-emerald-50 focus:outline-none dark:hover:bg-emerald-900/20"
                          >
                            <span className="block font-medium text-gray-900 dark:text-white">{suggestion.address}</span>
                            {(suggestion.city || suggestion.province) && (
                              <span className="block text-xs text-gray-500 dark:text-gray-400">
                                {[suggestion.city, suggestion.province].filter(Boolean).join(", ")}
                              </span>
                            )}
                          </button>
                        ))
                      ) : (
                        <p className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                          No matching address found. You can still type it manually.
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-gray-400">
                  Suggestions use free OpenStreetMap data. You can always edit the address manually.
                </p>
                <label className="mt-3 flex cursor-pointer select-none items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <input
                    type="checkbox"
                    {...register("acceptsWalkIns")}
                    className="mt-0.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>
                    Accepts walk-ins
                    <span className="block text-xs text-gray-400">People can visit this address without booking first.</span>
                  </span>
                </label>
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
                      {DAYS.filter((d) => d in avSchedules).map((day) => {
                        const invalid = invalidAvailabilityDays.includes(day);
                        const invalidClass = invalid ? "border-red-300 focus:ring-red-500 dark:border-red-700" : "";
                        return (
                          <div key={day} className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`w-9 flex-shrink-0 text-xs font-semibold ${invalid ? "text-red-600" : "text-gray-600 dark:text-gray-400"}`}>{day}</span>
                              <select value={avSchedules[day].from}
                                onChange={(e) => updateDayHours(day, "from", e.target.value)}
                                className={`${selectClass} ${invalidClass} flex-1 text-xs py-1.5`}>
                                {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                              </select>
                              <span className="text-xs text-gray-400 flex-shrink-0">to</span>
                              <select value={avSchedules[day].to}
                                onChange={(e) => updateDayHours(day, "to", e.target.value)}
                                className={`${selectClass} ${invalidClass} flex-1 text-xs py-1.5`}>
                                {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                              </select>
                            </div>
                            {invalid && (
                              <p className="pl-11 text-xs text-red-600">End time must be after start time.</p>
                            )}
                          </div>
                        );
                      })}
                      {availabilityError && (
                        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                          {availabilityError}
                        </p>
                      )}
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
                    <PhoneInput id="phone" value={phoneValue} onChange={handlePhoneValueChange} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <input
                      type="checkbox"
                      checked={whatsappSameAsPhone}
                      onChange={(event) => handleWhatsAppSameAsPhone(event.target.checked)}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    Same as phone
                  </label>
                  {!whatsappSameAsPhone && (
                    <PhoneInput value={watch("whatsapp") ?? ""} onChange={(val) => setValue("whatsapp", val)} />
                  )}
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
                {selectedMosqueId === "unlisted" && (
                  <div className="mt-4 rounded-xl border border-emerald-200 bg-white/80 p-4 dark:border-emerald-900/40 dark:bg-gray-950/30">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Recommend a mosque for admin review</p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Share what you know. Admins can use this to onboard the mosque and verify affiliation details.
                    </p>
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="mosqueSuggestionName">Mosque name *</Label>
                        <Input id="mosqueSuggestionName" {...register("mosqueSuggestionName")} className="mt-1.5" placeholder="e.g. Islamic Centre of..." />
                        {errors.mosqueSuggestionName && <p className="text-xs text-red-600 mt-1">{errors.mosqueSuggestionName.message}</p>}
                      </div>
                      <div>
                        <Label htmlFor="mosqueSuggestionCity">City / area</Label>
                        <Input id="mosqueSuggestionCity" {...register("mosqueSuggestionCity")} className="mt-1.5" placeholder="e.g. Newmarket" />
                      </div>
                      <div className="sm:col-span-2">
                        <Label htmlFor="mosqueSuggestionAddress">Address <span className="text-gray-400 font-normal">(optional)</span></Label>
                        <Input id="mosqueSuggestionAddress" {...register("mosqueSuggestionAddress")} className="mt-1.5" placeholder="Street address, if known" />
                      </div>
                      <div>
                        <Label htmlFor="mosqueSuggestionWebsite">Website <span className="text-gray-400 font-normal">(optional)</span></Label>
                        <Input id="mosqueSuggestionWebsite" type="url" {...register("mosqueSuggestionWebsite")} className="mt-1.5" placeholder="https://..." />
                      </div>
                      <div>
                        <Label htmlFor="mosqueSuggestionChannelName">Community channel <span className="text-gray-400 font-normal">(optional)</span></Label>
                        <Input id="mosqueSuggestionChannelName" {...register("mosqueSuggestionChannelName")} className="mt-1.5" placeholder="WhatsApp group, Telegram, email list..." />
                      </div>
                      <div className="sm:col-span-2">
                        <Label htmlFor="mosqueSuggestionChannelLink">Community link <span className="text-gray-400 font-normal">(optional)</span></Label>
                        <Input id="mosqueSuggestionChannelLink" type="url" {...register("mosqueSuggestionChannelLink")} className="mt-1.5" placeholder="Invite link or website page, if available" />
                      </div>
                      <div className="sm:col-span-2">
                        <Label htmlFor="mosqueSuggestionNotes">Affiliation notes <span className="text-gray-400 font-normal">(optional)</span></Label>
                        <Textarea id="mosqueSuggestionNotes" {...register("mosqueSuggestionNotes")} className="mt-1.5 resize-none" rows={3} placeholder="e.g. I attend regularly, I’m in their WhatsApp community, or who admin can contact to verify." />
                      </div>
                    </div>
                    {(errors.mosqueSuggestionWebsite || errors.mosqueSuggestionChannelLink) && (
                      <p className="mt-2 text-xs text-red-600">
                        {errors.mosqueSuggestionWebsite?.message ?? errors.mosqueSuggestionChannelLink?.message}
                      </p>
                    )}
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  An admin will verify your affiliation before approving your listing. If your mosque isn&apos;t listed, your profile can still be approved — the affiliation badge will not appear until your mosque is onboarded.
                </p>

                {selectedMosqueId && selectedMosqueId !== "unlisted" && (
                  <div className="mt-3 rounded-lg border border-emerald-200 bg-white dark:bg-gray-900 p-3">
                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={affiliationConsent}
                        onChange={(e) => setAffiliationConsent(e.target.checked)}
                        className="mt-0.5 flex-shrink-0 rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        I confirm I am an active member of this mosque community (regular attendee or community channel member), and I consent to this affiliation being displayed publicly on my listing. I understand I can update or remove this at any time.
                      </span>
                    </label>
                  </div>
                )}
              </div>

              {/* Business logo */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Business Logo <span className="text-gray-400 font-normal">(optional)</span></p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Appears on your Featured Business card and Sponsored carousel.
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
                  Best results: <strong className="text-gray-500 dark:text-gray-400">square format</strong> (e.g. 400×400 px) · wide/landscape logos will appear small in the square tile · if your logo is horizontal, add white padding above and below to make it square before uploading · max 40 MB · JPG, PNG, WebP
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
                    <p className="text-xs text-gray-400">Most phone and web image formats work · We optimize on upload</p>
                  </div>
                </div>
                <input ref={logoInputRef} type="file" accept="image/*,.heic,.heif,.avif" onChange={handleLogoChange} className="hidden" />
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
              {isSubmitting ? "Submitting…" : isEdit ? "Save Changes" : "Submit Application"}
            </Button>
          )}
        </div>

        {isEdit ? (
          <p className="text-xs text-center text-gray-400 mt-3">
            Edited listings return to admin review before going live again.
          </p>
        ) : (
          <div className="mt-3 text-center">
            <p className="text-xs text-gray-400">
              Your application will be reviewed by our admin team before going live.
            </p>
          </div>
        )}
      </form>
    </div>
  );
}

function CategorySuggestionPanel({ categories, selectedCategoryId }: { categories: Category[]; selectedCategoryId: string }) {
  const selectedCat = categories.find((c) => c.id === selectedCategoryId);
  const isOther = selectedCat?.slug === "other";

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (!isOther && !open) return (
    <button type="button" onClick={() => setOpen(true)} className="flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 mt-1">
      <Lightbulb className="h-3.5 w-3.5" /> Can&apos;t find your category? Suggest one
    </button>
  );

  if (done) return (
    <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 mt-1">
      <Check className="h-4 w-4 flex-shrink-0" />
      Category suggestion submitted! Admin will review it. Continue registering with <strong>Other</strong> for now — you can update your category once it&apos;s approved.
    </div>
  );

  async function handleSuggest() {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await submitCategorySuggestion(name.trim(), icon.trim() || undefined);
      setDone(true);
    } catch {
      // silent — non-blocking
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-2 border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/60 dark:bg-emerald-900/10 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
          <Lightbulb className="h-4 w-4" /> Suggest a new category
        </p>
        {!isOther && (
          <button type="button" onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Admin will review your suggestion. Once approved it will appear for all professionals and members. In the meantime, select <strong>Other</strong> to complete your registration.
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          placeholder="Emoji"
          className="w-16 border border-gray-300 dark:border-gray-700 rounded-lg px-2 py-2 bg-white dark:bg-gray-900 text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
          maxLength={4}
        />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Category name (e.g. Solar Panel Installer)"
          className="flex-1 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>
      <Button
        type="button"
        size="sm"
        disabled={!name.trim() || submitting}
        onClick={handleSuggest}
        className="bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40"
      >
        {submitting ? "Submitting…" : "Submit suggestion"}
      </Button>
    </div>
  );
}
