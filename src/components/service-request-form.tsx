"use client";

import { useState } from "react";
import { Mail, Phone, MessageCircle, CheckCircle2, ArrowRight, ArrowLeft, MapPin, Calendar, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { submitServiceRequest } from "@/lib/actions/service-requests";

interface Category { id: string; name: string; icon?: string | null; slug?: string }
interface ServiceArea { id: string; name: string }
interface Props {
  categories: Category[];
  serviceAreas: ServiceArea[];
  defaultEmail?: string;
  defaultPhone?: string;
  defaultWhatsapp?: string;
}

type ContactMethod = "EMAIL" | "PHONE" | "WHATSAPP";

interface FormState {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  serviceAreaId: string;
  description: string;
  preferredContact: ContactMethod;
  contactValue: string;
  preferredDate: string;
}

const STEPS = ["Category", "Description", "Location & Date", "Contact", "Review"];

const CONTACT_OPTIONS = [
  { value: "EMAIL" as ContactMethod, label: "Email", icon: <Mail className="h-5 w-5" /> },
  { value: "PHONE" as ContactMethod, label: "Phone call", icon: <Phone className="h-5 w-5" /> },
  { value: "WHATSAPP" as ContactMethod, label: "WhatsApp", icon: <MessageCircle className="h-5 w-5" /> },
];

export function ServiceRequestForm({ categories, serviceAreas, defaultEmail = "", defaultPhone = "", defaultWhatsapp = "" }: Props) {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<FormState>({
    categoryId: "",
    categoryName: "",
    categoryIcon: "",
    serviceAreaId: "",
    description: "",
    preferredContact: "EMAIL",
    contactValue: defaultEmail,
    preferredDate: "",
  });

  const totalSteps = STEPS.length;
  const progress = ((step) / (totalSteps - 1)) * 100;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function contactDefault(method: ContactMethod) {
    if (method === "EMAIL") return defaultEmail;
    if (method === "PHONE") return defaultPhone;
    if (method === "WHATSAPP") return defaultWhatsapp || defaultPhone;
    return "";
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      await submitServiceRequest({
        categoryId: form.categoryId,
        serviceAreaId: form.serviceAreaId || undefined,
        description: form.description,
        preferredContact: form.preferredContact,
        contactValue: form.contactValue,
        preferredDate: form.preferredDate || undefined,
      });
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
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
          onClick={() => { setSubmitted(false); setStep(0); setForm({ categoryId: "", categoryName: "", categoryIcon: "", serviceAreaId: "", description: "", preferredContact: "EMAIL", contactValue: defaultEmail, preferredDate: "" }); }}
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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  set("categoryId", c.id);
                  set("categoryName", c.name);
                  set("categoryIcon", c.icon ?? "");
                  setStep(1);
                }}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-sm font-medium transition-all duration-150 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 ${
                  form.categoryId === c.id
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700"
                    : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                <span className="text-2xl">{c.icon}</span>
                <span className="text-center leading-tight">{c.name}</span>
              </button>
            ))}
          </div>
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
            autoFocus
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="e.g. I need a licensed electrician to install 3 new outlets in my basement. The work needs to be done within the next 2 weeks…"
            rows={6}
            className="resize-none text-base"
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
            Where and when?
          </h2>
          <p className="text-sm text-gray-400 mb-6">Both fields are optional — skip if you're flexible.</p>

          <div className="space-y-5">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <MapPin className="h-4 w-4 text-gray-400" /> Your area
              </label>
              <div className="relative">
                <select
                  value={form.serviceAreaId}
                  onChange={(e) => set("serviceAreaId", e.target.value)}
                  className="w-full appearance-none border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-9"
                >
                  <option value="">Any area / I'm flexible</option>
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
              <input
                type="date"
                value={form.preferredDate}
                onChange={(e) => set("preferredDate", e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <StepButtons onBack={() => setStep(1)} onNext={() => setStep(3)} skipLabel="Skip" />
        </div>
      )}

      {/* ── Step 3: Contact ────────────────────────────── */}
      {step === 3 && (
        <div className="px-6 pb-8 pt-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            How should professionals reach you?
          </h2>
          <p className="text-sm text-gray-400 mb-6">Only shared with professionals who respond to your request.</p>

          <div className="grid grid-cols-3 gap-2.5 mb-5">
            {CONTACT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  set("preferredContact", opt.value);
                  set("contactValue", contactDefault(opt.value));
                }}
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

          {form.preferredContact === "EMAIL" ? (
            <Input
              autoFocus
              type="email"
              value={form.contactValue}
              onChange={(e) => set("contactValue", e.target.value)}
              placeholder="your@email.com"
              className="text-base"
            />
          ) : (
            <PhoneInput
              value={form.contactValue}
              onChange={(v) => set("contactValue", v)}
              placeholder={form.preferredContact === "WHATSAPP" ? "416 555 0000 (WhatsApp)" : "416 555 0000"}
            />
          )}

          <StepButtons
            onBack={() => setStep(2)}
            onNext={() => setStep(4)}
            nextDisabled={!form.contactValue.trim()}
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
            <ReviewRow label="Category" value={`${form.categoryIcon} ${form.categoryName}`} onEdit={() => setStep(0)} />
            <ReviewRow label="Description" value={form.description} onEdit={() => setStep(1)} multiline />
            <ReviewRow
              label="Location"
              value={form.serviceAreaId ? (serviceAreas.find(a => a.id === form.serviceAreaId)?.name ?? "—") : "Any area"}
              onEdit={() => setStep(2)}
            />
            {form.preferredDate && (
              <ReviewRow
                label="Preferred date"
                value={new Date(form.preferredDate).toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric" })}
                onEdit={() => setStep(2)}
              />
            )}
            <ReviewRow
              label="Contact via"
              value={`${form.preferredContact.charAt(0) + form.preferredContact.slice(1).toLowerCase().replace("app", "App")} — ${form.contactValue}`}
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

function StepButtons({ onBack, onNext, nextDisabled, skipLabel }: {
  onBack: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  skipLabel?: string;
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
        {skipLabel && nextDisabled === undefined ? skipLabel : "Continue"}
        <ArrowRight className="h-4 w-4" />
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
