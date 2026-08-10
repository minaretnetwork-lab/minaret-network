"use client";

import { useState } from "react";
import {
  Mail, Phone, MessageCircle, CheckCircle2, ArrowRight, ArrowLeft, MapPin, Calendar, ChevronDown, LocateFixed, Loader2, LogIn, UserPlus,
  ChevronLeft, ChevronRight,
  Stethoscope, SmilePlus, Pill, Activity, Bone, Eye, Brain,
  Scale, Globe, FileText, Calculator, TrendingUp, Shield, Landmark, Home,
  HardHat, Hammer, Zap, Wrench, Wind, Building2, Paintbrush, Layers, Leaf,
  Snowflake, ClipboardCheck, Truck, Bug, Plug, Sparkles, Settings,
  BookOpen, Car, Dumbbell, Monitor, Code2, Palette, Camera, Video,
  Scissors, UtensilsCrossed, PawPrint, Briefcase, Plane, Baby, Star, Search,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { submitServiceRequest } from "@/lib/actions/service-requests";
import {
  cacheDetectedCity,
  CITY_POSITION_OPTIONS,
  clearCachedDetectedCity,
  getCachedDetectedCity,
} from "@/lib/client-location";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "doctor": Stethoscope,
  "dentist": SmilePlus,
  "pharmacist": Pill,
  "physiotherapist": Activity,
  "chiropractor": Bone,
  "optometrist": Eye,
  "counsellor": Brain,
  "lawyer": Scale,
  "immigration-consultant": Globe,
  "notary-public": FileText,
  "accountant": Calculator,
  "financial-advisor": TrendingUp,
  "insurance-broker": Shield,
  "mortgage-broker": Landmark,
  "realtor": Home,
  "contractor": HardHat,
  "handyman": Hammer,
  "electrician": Zap,
  "plumber": Wrench,
  "hvac": Wind,
  "roofer": Building2,
  "painter": Paintbrush,
  "flooring": Layers,
  "landscaper": Leaf,
  "snow-removal": Snowflake,
  "home-inspector": ClipboardCheck,
  "moving-services": Truck,
  "pest-control": Bug,
  "appliance-repair": Plug,
  "cleaning-services": Sparkles,
  "mechanic": Settings,
  "tutor": BookOpen,
  "driving-instructor": Car,
  "personal-trainer": Dumbbell,
  "it-consultant": Monitor,
  "web-developer": Code2,
  "graphic-designer": Palette,
  "photographer": Camera,
  "videographer": Video,
  "tailor-alterations": Scissors,
  "barber-hair-stylist": Scissors,
  "event-wedding-planner": Calendar,
  "restaurant-catering": UtensilsCrossed,
  "pet-sitter": PawPrint,
  "business-consultant": Briefcase,
  "travel-agent": Plane,
  "childcare": Baby,
};

function CategoryIcon({ slug, className }: { slug?: string; className?: string }) {
  const Icon = (slug && CATEGORY_ICONS[slug]) || Star;
  return <Icon className={className} />;
}

interface Category { id: string; name: string; icon?: string | null; slug?: string }
interface ServiceArea { id: string; name: string }
interface Props {
  categories: Category[];
  serviceAreas: ServiceArea[];
  isAuthenticated: boolean;
  defaultName?: string;
  defaultEmail?: string;
  defaultPhone?: string;
}

type ContactMethod = "EMAIL" | "PHONE" | "WHATSAPP";

interface FormState {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  serviceAreaId: string;
  description: string;
  preferredContact: ContactMethod;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  preferredDate: string;
}

const STEPS = ["Category", "Description", "Location & Date", "Contact", "Review"];

const CONTACT_OPTIONS = [
  { value: "EMAIL" as ContactMethod, label: "Email", icon: <Mail className="h-5 w-5" /> },
  { value: "PHONE" as ContactMethod, label: "Phone call", icon: <Phone className="h-5 w-5" /> },
  { value: "WHATSAPP" as ContactMethod, label: "WhatsApp", icon: <MessageCircle className="h-5 w-5" /> },
];

const CATEGORY_EXAMPLES: Record<string, string> = {
  accountant: "e.g. I need help filing my small business taxes and reviewing HST expenses before the end of the month.",
  "appliance-repair": "e.g. My refrigerator is cooling unevenly and making a loud humming noise. I need someone to inspect and repair it this week.",
  "barber-hair-stylist": "e.g. I need a barber who can do a clean fade and beard lineup before an event this weekend.",
  "business-consultant": "e.g. I need help setting up a simple business plan and pricing model for a new home-based service.",
  childcare: "e.g. I need a babysitter for two children on weekday afternoons for the next few weeks.",
  chiropractor: "e.g. I have lower back stiffness after sitting at work and would like an appointment for an assessment.",
  "cleaning-services": "e.g. I need a deep clean for a 3-bedroom home, including kitchen, bathrooms, baseboards, and floors.",
  contractor: "e.g. I want to finish part of my basement and need someone to review the space and provide a quote.",
  counsellor: "e.g. I am looking for a counsellor for stress and anxiety support, preferably available evenings.",
  dentist: "e.g. I need a dentist for a cleaning and to check sensitivity in one tooth that has been bothering me.",
  doctor: "e.g. I need a family doctor appointment for a recurring cough and general checkup.",
  electrician: "e.g. I need a licensed electrician to install 3 new outlets in my basement within the next 2 weeks.",
  "event-wedding-planner": "e.g. I need help coordinating vendors and day-of scheduling for a wedding reception next month.",
  "financial-advisor": "e.g. I need advice on budgeting, saving for a home, and understanding halal investment options.",
  flooring: "e.g. I need vinyl flooring installed in a small basement room and old carpet removed.",
  "graphic-designer": "e.g. I need a logo and simple flyer design for a new local service business.",
  handyman: "e.g. I need help mounting shelves, fixing a loose cabinet door, and repairing a small drywall patch.",
  "home-inspector": "e.g. I need a home inspection before finalizing a purchase, ideally later this week.",
  hvac: "e.g. My furnace is running but the house is not warming properly. I need someone to diagnose it.",
  "immigration-consultant": "e.g. I need advice on a spouse sponsorship application and which documents to prepare.",
  "insurance-broker": "e.g. I need quotes for home and auto insurance and help comparing coverage options.",
  "it-consultant": "e.g. I need help setting up secure Wi-Fi, backups, and basic cybersecurity for my small office.",
  landscaper: "e.g. I need spring cleanup, hedge trimming, and help planning low-maintenance front yard landscaping.",
  lawyer: "e.g. I need a lawyer to review a lease agreement before I sign it.",
  mechanic: "e.g. My car is making a grinding noise when braking and I need it checked as soon as possible.",
  "mortgage-broker": "e.g. I need help understanding mortgage options and pre-approval for buying a home.",
  "moving-services": "e.g. I need movers for a 2-bedroom apartment move from Aurora to Newmarket next Saturday.",
  "notary-public": "e.g. I need documents notarized for an application and would prefer an evening appointment.",
  optometrist: "e.g. I need an eye exam and new glasses prescription because my vision has changed recently.",
  painter: "e.g. I need two bedrooms painted, including minor wall repair and trim touch-ups.",
  "personal-trainer": "e.g. I want a trainer to help me build strength safely with a beginner-friendly plan.",
  "pest-control": "e.g. I have ants appearing in the kitchen and need pest control to inspect and treat the issue.",
  "pet-sitter": "e.g. I need someone to check on my cat twice a day while I am away for a long weekend.",
  pharmacist: "e.g. I need a pharmacist to explain a new prescription and possible interactions with my current medication.",
  photographer: "e.g. I need a photographer for a small family event for about three hours.",
  physiotherapist: "e.g. I need physiotherapy for knee pain after running and would like an assessment.",
  plumber: "e.g. My kitchen sink is draining slowly and there may be a leak under the cabinet.",
  realtor: "e.g. I am looking for a realtor to help estimate my home value and discuss selling options.",
  "restaurant-catering": "e.g. I need halal catering for about 40 guests, including mains, sides, and delivery.",
  roofer: "e.g. I noticed a small roof leak after heavy rain and need someone to inspect and repair it.",
  "snow-removal": "e.g. I need seasonal snow removal for my driveway and walkway before winter starts.",
  "tailor-alterations": "e.g. I need a suit jacket and pants altered before a wedding next week.",
  "travel-agent": "e.g. I need help booking a family trip with flexible dates and halal-friendly accommodations.",
  tutor: "e.g. I need a math tutor for a Grade 9 student who needs help preparing for exams.",
  videographer: "e.g. I need a videographer for a community event and a short edited highlight video afterward.",
  "web-developer": "e.g. I need a simple website for my business with services, contact form, and basic SEO.",
};

const DRAFT_KEY = "minaret_draft_request";

function readStoredDraft() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(DRAFT_KEY);
    return JSON.parse(raw) as { form: FormState; step: number };
  } catch {
    return null;
  }
}

export function ServiceRequestForm({ categories, serviceAreas, isAuthenticated, defaultName = "", defaultEmail = "", defaultPhone = "" }: Props) {
  const emptyForm: FormState = {
    categoryId: "",
    categoryName: "",
    categoryIcon: "",
    serviceAreaId: "",
    description: "",
    preferredContact: "EMAIL",
    contactName: defaultName,
    contactEmail: defaultEmail,
    contactPhone: defaultPhone,
    preferredDate: "",
  };
  const [initialDraft] = useState(() => readStoredDraft());
  const [step, setStep] = useState(initialDraft?.step ?? 0);
  const [authGate, setAuthGate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [categoryQuery, setCategoryQuery] = useState("");
  const [descriptionFocused, setDescriptionFocused] = useState(false);
  const [form, setForm] = useState<FormState>(initialDraft?.form ?? emptyForm);
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(parseDateValue(initialDraft?.form.preferredDate) ?? todayDate()));
  const selectedCategory = categories.find((category) => category.id === form.categoryId);
  const descriptionExample =
    CATEGORY_EXAMPLES[selectedCategory?.slug ?? ""] ??
    `e.g. I need a ${selectedCategory?.name.toLowerCase() || "professional"} for a specific job. Please include timing, location, scope, and any important details.`;
  const descriptionPlaceholder = descriptionFocused ? "" : descriptionExample;
  const filteredCategories = categories.filter((category) => {
    const query = categoryQuery.trim().toLowerCase();
    if (!query) return true;

    return (
      category.name.toLowerCase().includes(query) ||
      (category.slug?.replace(/-/g, " ").toLowerCase().includes(query) ?? false)
    );
  });

  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState("");

  function selectDetectedArea(city: string) {
    const lower = city.toLowerCase();
    const match = serviceAreas.find((a) => a.name.toLowerCase().includes(lower) || lower.includes(a.name.toLowerCase()));
    if (match) {
      set("serviceAreaId", match.id);
      setLocateError("");
      return true;
    } else {
      setLocateError(`"${city}" not found in service areas.`);
      return false;
    }
  }

  async function detectArea() {
    if (!("geolocation" in navigator)) { setLocateError("Not supported by your browser."); return; }

    const cachedCity = getCachedDetectedCity();
    if (cachedCity && selectDetectedArea(cachedCity)) {
      return;
    }
    clearCachedDetectedCity();

    setLocating(true);
    setLocateError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(`/api/geocode/reverse?lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? "Location lookup failed.");
          const city = data.city ?? "";
          if (!city) { setLocateError("Couldn't detect your city."); return; }
          if (selectDetectedArea(city)) cacheDetectedCity(city);
        } catch { setLocateError("Location lookup failed."); }
        finally { setLocating(false); }
      },
      (err) => {
        setLocating(false);
        const message = err.code === err.PERMISSION_DENIED
          ? "Location permission is blocked. Allow it in your browser settings."
          : err.code === err.TIMEOUT
            ? "Location timed out. Try again or select manually."
            : "Couldn't read your location. Select manually.";
        setLocateError(message);
      },
      CITY_POSITION_OPTIONS
    );
  }

  const totalSteps = STEPS.length;
  const progress = ((step) / (totalSteps - 1)) * 100;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit() {
    if (!isAuthenticated) {
      try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ form, step: 4 })); } catch { /* ignore */ }
      setAuthGate(true);
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await submitServiceRequest({
        categoryId: form.categoryId,
        serviceAreaId: form.serviceAreaId || undefined,
        description: form.description,
        preferredContact: form.preferredContact,
        contactName: form.contactName,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
        preferredDate: form.preferredDate || undefined,
      });
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Auth gate (shown at submit time for unauthenticated users) ── */
  if (authGate) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 text-center shadow-sm">
        <div className="h-14 w-14 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-7 w-7 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2" style={{ fontFamily: "var(--font-lora)" }}>
          Almost there!
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 leading-relaxed">
          Your request is ready. Sign in or create a free account to submit it — your details have been saved.
        </p>
        <p className="text-xs text-gray-400 mb-6">Takes less than a minute.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="/auth/login?redirectTo=/request">
            <Button className="w-full sm:w-auto bg-[#14532d] hover:bg-[#166534] text-white gap-2">
              <LogIn className="h-4 w-4" /> Sign in
            </Button>
          </a>
          <a href="/auth/signup?redirectTo=/request">
            <Button variant="outline" className="w-full sm:w-auto gap-2 border-gray-200">
              <UserPlus className="h-4 w-4" /> Create account
            </Button>
          </a>
        </div>
        <button
          onClick={() => setAuthGate(false)}
          className="mt-4 text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2"
        >
          Go back to my request
        </button>
      </div>
    );
  }

  /* ── Success ─────────────────────────────────────────── */
  if (submitted) {
    return (
      <div className="text-center py-16 px-6">
        <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Request submitted!</h2>
        <p className="text-gray-500 leading-relaxed mb-8 max-w-sm mx-auto">
          Mosque-affiliated {form.categoryName} professionals have been notified. Expect to hear back via {form.preferredContact.charAt(0) + form.preferredContact.slice(1).toLowerCase()}.
        </p>
        <Button
          onClick={() => { setSubmitted(false); setStep(0); setForm(emptyForm); }}
          variant="outline"
          className="border-gray-200"
        >
          Submit another request
        </Button>
      </div>
    );
  }

  /* ── Shell ───────────────────────────────────────────── */
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">

      {/* Progress bar */}
      <div className="h-1 bg-gray-100 dark:bg-gray-800">
        <div
          className="h-full bg-emerald-500 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step label */}
      <div className="flex items-center justify-between px-6 pt-5 pb-1">
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          Step {step + 1} of {totalSteps}
        </span>
        <span className="text-xs text-gray-400">{STEPS[step]}</span>
      </div>

      {/* ── Step 0: Category ───────────────────────────── */}
      {step === 0 && (
        <div className="px-6 pb-8 pt-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            What type of professional do you need?
          </h2>
          <p className="text-sm text-gray-400 mb-6">Select one to continue.</p>
          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              value={categoryQuery}
              onChange={(e) => setCategoryQuery(e.target.value)}
              placeholder="Type a profession to filter..."
              className="h-12 rounded-xl pl-10 text-base"
            />
          </div>
          {filteredCategories.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center dark:border-gray-700 dark:bg-gray-800/40">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">No categories match “{categoryQuery}”.</p>
              <p className="mt-1 text-xs text-gray-400">Try a broader term like plumber, doctor, realtor, or childcare.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {filteredCategories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    set("categoryId", c.id);
                    set("categoryName", c.name);
                    set("categoryIcon", c.icon ?? "");
                    setCategoryQuery("");
                    setStep(1);
                  }}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-sm font-medium transition-all duration-150 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 ${
                    form.categoryId === c.id
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700"
                      : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <div className="h-8 w-8 flex items-center justify-center">
                    <CategoryIcon slug={c.slug} className="h-6 w-6" />
                  </div>
                  <span className="text-center leading-tight">{c.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Step 1: Description ────────────────────────── */}
      {step === 1 && (
        <div className="px-6 pb-8 pt-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Describe what you need
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            The more detail you give, the better. Include scope, size, timeline, and any specific requirements.
          </p>
          <Textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            onFocus={() => setDescriptionFocused(true)}
            onBlur={() => setDescriptionFocused(false)}
            placeholder={descriptionPlaceholder}
            rows={8}
            className="min-h-48 resize-none text-base leading-relaxed placeholder:text-gray-400"
          />
          <div className="flex items-center justify-between mt-2">
            <span className={`text-xs ${form.description.length < 30 ? "text-gray-400" : "text-emerald-600"}`}>
              {form.description.length < 30 ? `${30 - form.description.length} more characters needed` : `${form.description.length} characters ✓`}
            </span>
          </div>
          <StepButtons
            onBack={() => setStep(0)}
            onNext={() => setStep(2)}
            nextDisabled={form.description.length < 30}
          />
        </div>
      )}

      {/* ── Step 2: Location & Date ────────────────────── */}
      {step === 2 && (
        <div className="px-6 pb-8 pt-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Where is the job?
          </h2>
          <p className="text-sm text-gray-400 mb-6">This helps professionals know if they serve your area.</p>

          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <MapPin className="h-4 w-4 text-gray-400" /> Your area <span className="text-red-500 ml-0.5">*</span>
                </label>
                <button
                  type="button"
                  onClick={detectArea}
                  disabled={locating}
                  className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-800 disabled:opacity-50 transition-colors"
                >
                  {locating ? <Loader2 className="h-3 w-3 animate-spin" /> : <LocateFixed className="h-3 w-3" />}
                  Use my location
                </button>
              </div>
              {locateError && <p className="text-xs text-amber-600 mb-1.5">{locateError}</p>}
              <div className="relative">
                <select
                  value={form.serviceAreaId}
                  onChange={(e) => set("serviceAreaId", e.target.value)}
                  className="w-full appearance-none border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-9"
                >
                  <option value="">Select your area…</option>
                  {serviceAreas.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="h-4 w-4 text-gray-400" /> Preferred date
              </label>
              <PreferredDatePicker
                value={form.preferredDate}
                calendarMonth={calendarMonth}
                onMonthChange={setCalendarMonth}
                onChange={(value) => set("preferredDate", value)}
              />
            </div>
          </div>

          <StepButtons onBack={() => setStep(1)} onNext={() => setStep(3)} nextDisabled={!form.serviceAreaId} />
        </div>
      )}

      {/* ── Step 3: Contact ────────────────────────────── */}
      {step === 3 && (
        <div className="px-6 pb-8 pt-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            How should professionals reach you?
          </h2>
          <p className="text-sm text-gray-400 mb-6">Only shared with professionals who respond to your request.</p>

          <div className="space-y-4 mb-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Your name <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={form.contactName}
                onChange={(e) => set("contactName", e.target.value)}
                placeholder="Full name"
                className="text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Email address <span className="text-red-500">*</span>
              </label>
              <Input
                type="email"
                value={form.contactEmail}
                onChange={(e) => set("contactEmail", e.target.value)}
                placeholder="your@email.com"
                className="text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Phone number <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <PhoneInput
                value={form.contactPhone}
                onChange={(v) => set("contactPhone", v)}
                placeholder="416 555 0000"
              />
            </div>
          </div>

          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2.5">Preferred contact method</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {CONTACT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => set("preferredContact", opt.value)}
                className={`flex flex-col items-center gap-2 py-4 rounded-xl border-2 text-sm font-medium transition-all duration-150 ${
                  form.preferredContact === opt.value
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700"
                    : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-emerald-300"
                }`}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>

          <StepButtons
            onBack={() => setStep(2)}
            onNext={() => setStep(4)}
            nextDisabled={!form.contactName.trim() || !form.contactEmail.trim()}
          />
        </div>
      )}

      {/* ── Step 4: Review ─────────────────────────────── */}
      {step === 4 && (
        <div className="px-6 pb-8 pt-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Review your request
          </h2>
          <p className="text-sm text-gray-400 mb-6">Everything look good? Hit submit to notify professionals.</p>

          <div className="space-y-3 mb-6">
            <ReviewRow label="Category" value={form.categoryName} onEdit={() => setStep(0)} />
            <ReviewRow label="Description" value={form.description} onEdit={() => setStep(1)} multiline />
            <ReviewRow
              label="Location"
              value={serviceAreas.find(a => a.id === form.serviceAreaId)?.name ?? "—"}
              onEdit={() => setStep(2)}
            />
            {form.preferredDate && (
              <ReviewRow
                label="Preferred date"
                value={new Date(form.preferredDate).toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric" })}
                onEdit={() => setStep(2)}
              />
            )}
            <ReviewRow label="Name" value={form.contactName} onEdit={() => setStep(3)} />
            <ReviewRow label="Email" value={form.contactEmail} onEdit={() => setStep(3)} />
            {form.contactPhone && <ReviewRow label="Phone" value={form.contactPhone} onEdit={() => setStep(3)} />}
            <ReviewRow
              label="Preferred contact"
              value={{ EMAIL: "Email", PHONE: "Phone call", WHATSAPP: "WhatsApp" }[form.preferredContact]}
              onEdit={() => setStep(3)}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">{error}</p>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(3)} className="gap-1.5 border-gray-200">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 bg-[#14532d] hover:bg-[#166534] text-white h-11 text-base font-medium gap-2"
            >
              {submitting ? "Submitting…" : "Submit Request"}
              {!submitting && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function PreferredDatePicker({
  value,
  calendarMonth,
  onMonthChange,
  onChange,
}: {
  value: string;
  calendarMonth: Date;
  onMonthChange: (date: Date) => void;
  onChange: (value: string) => void;
}) {
  const selectedDate = parseDateValue(value);
  const today = todayDate();
  const monthDays = buildMonthDays(calendarMonth);
  const monthLabel = calendarMonth.toLocaleDateString("en-CA", { month: "long", year: "numeric" });
  const selectedLabel = selectedDate
    ? selectedDate.toLocaleDateString("en-CA", { weekday: "short", month: "long", day: "numeric", year: "numeric" })
    : "Select a preferred date";
  const canGoPrevious = startOfMonth(calendarMonth) > startOfMonth(today);

  function selectDate(date: Date) {
    if (isBeforeDay(date, today)) return;
    onChange(formatDateValue(date));
    onMonthChange(startOfMonth(date));
  }

  return (
    <div className="rounded-xl border border-gray-300 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Preferred date</p>
          <p className={`text-sm font-medium ${selectedDate ? "text-gray-900 dark:text-white" : "text-gray-400"}`}>
            {selectedLabel}
          </p>
        </div>
        {selectedDate && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="rounded-full px-2.5 py-1 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            Clear
          </button>
        )}
      </div>

      <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-950">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onMonthChange(addMonths(calendarMonth, -1))}
            disabled={!canGoPrevious}
            aria-label="Previous month"
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-white hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-gray-900 dark:hover:text-white"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{monthLabel}</p>
          <button
            type="button"
            onClick={() => onMonthChange(addMonths(calendarMonth, 1))}
            aria-label="Next month"
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-white hover:text-gray-900 dark:hover:bg-gray-900 dark:hover:text-white"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {monthDays.map((date, index) => {
            if (!date) return <span key={`empty-${index}`} className="h-10" />;

            const disabled = isBeforeDay(date, today);
            const selected = selectedDate ? isSameDay(date, selectedDate) : false;
            return (
              <button
                key={formatDateValue(date)}
                type="button"
                disabled={disabled}
                onClick={() => selectDate(date)}
                className={`flex h-10 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  selected
                    ? "bg-emerald-600 text-white shadow-sm"
                    : disabled
                      ? "cursor-not-allowed text-gray-300 line-through dark:text-gray-700"
                      : "text-gray-800 hover:bg-white hover:text-emerald-700 dark:text-gray-100 dark:hover:bg-gray-900 dark:hover:text-emerald-300"
                }`}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function todayDate() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function parseDateValue(value?: string | null) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isBeforeDay(a: Date, b: Date) {
  const left = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const right = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return left < right;
}

function buildMonthDays(month: Date): Array<Date | null> {
  const firstDay = startOfMonth(month);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const blanks = Array.from({ length: firstDay.getDay() }, () => null as Date | null);
  const days = Array.from({ length: daysInMonth }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index + 1));

  return [...blanks, ...days];
}

function StepButtons({ onBack, onNext, nextDisabled }: {
  onBack: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
}) {
  return (
    <div className="flex gap-3 mt-6">
      <Button variant="outline" onClick={onBack} className="gap-1.5 border-gray-200">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>
      <Button
        onClick={onNext}
        disabled={nextDisabled}
        className="flex-1 bg-[#14532d] hover:bg-[#166534] text-white gap-1.5 disabled:opacity-40"
      >
        Continue <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

function ReviewRow({ label, value, onEdit, multiline }: {
  label: string; value: string; onEdit: () => void; multiline?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-0.5">{label}</p>
        <p className={`text-sm text-gray-800 dark:text-gray-200 ${multiline ? "line-clamp-3 leading-relaxed" : ""}`}>
          {value}
        </p>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex-shrink-0 mt-1"
      >
        Edit
      </button>
    </div>
  );
}
