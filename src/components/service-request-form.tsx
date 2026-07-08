"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitServiceRequest } from "@/lib/actions/service-requests";

const schema = z.object({
  categoryId: z.string().min(1, "Please select a category"),
  serviceAreaId: z.string().optional(),
  description: z.string().min(30, "Please provide at least 30 characters of description"),
  preferredContact: z.enum(["EMAIL", "PHONE", "WHATSAPP"]),
  preferredDate: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Category { id: string; name: string; icon?: string | null }
interface ServiceArea { id: string; name: string }

interface Props {
  categories: Category[];
  serviceAreas: ServiceArea[];
}

export function ServiceRequestForm({ categories, serviceAreas }: Props) {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { preferredContact: "EMAIL" },
  });

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
          Your request has been received. Professionals in that category will be notified.
        </p>
        <Button onClick={() => setStatus("idle")} variant="outline" className="mt-5">
          Submit Another Request
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-5 shadow-sm">
      <div>
        <Label htmlFor="categoryId">What type of professional do you need? *</Label>
        <select
          id="categoryId"
          {...register("categoryId")}
          className="mt-1.5 w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Select a category…</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
          ))}
        </select>
        {errors.categoryId && <p className="text-xs text-red-600 mt-1">{errors.categoryId.message}</p>}
      </div>

      <div>
        <Label htmlFor="serviceAreaId">Preferred Location (optional)</Label>
        <select
          id="serviceAreaId"
          {...register("serviceAreaId")}
          className="mt-1.5 w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
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
          placeholder="Please describe the service you're looking for in detail…"
          rows={4}
          className="mt-1.5 resize-none"
        />
        {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description.message}</p>}
      </div>

      <div>
        <Label>Preferred Contact Method *</Label>
        <div className="mt-2 flex gap-4">
          {(["EMAIL", "PHONE", "WHATSAPP"] as const).map((method) => (
            <label key={method} className="flex items-center gap-1.5 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
              <input type="radio" value={method} {...register("preferredContact")} className="text-green-600 focus:ring-green-500" />
              {method.charAt(0) + method.slice(1).toLowerCase()}
            </label>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="preferredDate">Preferred Date (optional)</Label>
        <input
          id="preferredDate"
          type="date"
          {...register("preferredDate")}
          className="mt-1.5 w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {status === "error" && (
        <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
          {errorMsg}
        </p>
      )}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-green-600 hover:bg-green-700 text-white h-11"
      >
        {isSubmitting ? "Submitting…" : "Submit Request"}
      </Button>
    </form>
  );
}
