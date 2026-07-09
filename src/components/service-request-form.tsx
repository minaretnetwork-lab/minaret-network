"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { submitServiceRequest } from "@/lib/actions/service-requests";
import { Mail, Phone, MessageCircle } from "lucide-react";
import { PhoneInput } from "@/components/ui/phone-input";

const schema = z.object({
  categoryId: z.string().min(1, "Please select a category"),
  serviceAreaId: z.string().optional(),
  description: z.string().min(30, "Please provide at least 30 characters of description"),
  preferredContact: z.enum(["EMAIL", "PHONE", "WHATSAPP"]),
  contactValue: z.string().min(1, "Please provide your contact detail"),
  preferredDate: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Category { id: string; name: string; icon?: string | null }
interface ServiceArea { id: string; name: string }
interface Props {
  categories: Category[];
  serviceAreas: ServiceArea[];
  defaultEmail?: string;
  defaultPhone?: string;
  defaultWhatsapp?: string;
}

const CONTACT_OPTIONS = [
  { value: "EMAIL", label: "Email", icon: <Mail className="h-3.5 w-3.5" /> },
  { value: "PHONE", label: "Phone", icon: <Phone className="h-3.5 w-3.5" /> },
  { value: "WHATSAPP", label: "WhatsApp", icon: <MessageCircle className="h-3.5 w-3.5" /> },
] as const;

export function ServiceRequestForm({ categories, serviceAreas, defaultEmail = "", defaultPhone = "", defaultWhatsapp = "" }: Props) {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const { register, handleSubmit, reset, control, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { preferredContact: "EMAIL", contactValue: defaultEmail },
  });

  const preferredContact = useWatch({ control, name: "preferredContact" });

  function handleContactMethodChange(method: "EMAIL" | "PHONE" | "WHATSAPP") {
    setValue("preferredContact", method);
    if (method === "EMAIL") setValue("contactValue", defaultEmail);
    else if (method === "PHONE") setValue("contactValue", defaultPhone);
    else if (method === "WHATSAPP") setValue("contactValue", defaultWhatsapp || defaultPhone);
    else setValue("contactValue", "");
  }

  async function onSubmit(data: FormData) {
    try {
      await submitServiceRequest(data);
      setStatus("success");
      reset();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-8 text-center">
        <div className="text-4xl mb-3">✅</div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Request Submitted!</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Your request has been received. Professionals in that category will be notified and will reach out to you directly.
        </p>
        <Button onClick={() => setStatus("idle")} variant="outline" className="mt-5">
          Submit Another Request
        </Button>
      </div>
    );
  }

  const selectClass = "mt-1.5 w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-5 shadow-sm">

      <div>
        <Label htmlFor="categoryId">What type of professional do you need? *</Label>
        <select id="categoryId" {...register("categoryId")} className={selectClass}>
          <option value="">Select a category…</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
          ))}
        </select>
        {errors.categoryId && <p className="text-xs text-red-600 mt-1">{errors.categoryId.message}</p>}
      </div>

      <div>
        <Label htmlFor="serviceAreaId">Your Location (optional)</Label>
        <select id="serviceAreaId" {...register("serviceAreaId")} className={selectClass}>
          <option value="">Any area</option>
          {serviceAreas.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="description">Describe what you need *</Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Describe the job in detail — scope, size, timeline, any specific requirements. The more detail you provide, the better quotes you'll receive."
          rows={5}
          className="mt-1.5 resize-none"
        />
        {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description.message}</p>}
      </div>

      {/* Contact method + value */}
      <div className="space-y-3">
        <Label>How should professionals contact you? *</Label>
        <div className="flex gap-2">
          {CONTACT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleContactMethodChange(opt.value)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                preferredContact === opt.value
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-emerald-400"
              }`}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
        {preferredContact === "EMAIL" ? (
          <Input
            type="email"
            {...register("contactValue")}
            placeholder="your@email.com"
            className="mt-1"
          />
        ) : (
          <PhoneInput
            value={watch("contactValue") ?? ""}
            onChange={(val) => setValue("contactValue", val)}
            placeholder={preferredContact === "WHATSAPP" ? "416 555 0000 (WhatsApp)" : "416 555 0000"}
          />
        )}
        {errors.contactValue && <p className="text-xs text-red-600 mt-1">{errors.contactValue.message}</p>}
        <p className="text-xs text-gray-400">This will only be shared with professionals who respond to your request.</p>
      </div>

      <div>
        <Label htmlFor="preferredDate">Preferred Date (optional)</Label>
        <input
          id="preferredDate"
          type="date"
          {...register("preferredDate")}
          className={selectClass}
        />
      </div>

      {status === "error" && (
        <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
          {errorMsg}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full bg-green-600 hover:bg-green-700 text-white h-11">
        {isSubmitting ? "Submitting…" : "Submit Request"}
      </Button>

      <p className="text-xs text-center text-gray-400">
        Mosque affiliated professionals in your chosen category and area will be notified of your request.
      </p>
    </form>
  );
}
