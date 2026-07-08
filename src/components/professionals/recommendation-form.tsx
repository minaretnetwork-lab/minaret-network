"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitRecommendation } from "@/lib/actions/recommendations";

const schema = z.object({
  content: z.string().min(20, "Please write at least 20 characters").max(500, "Maximum 500 characters"),
  highlyRecommended: z.boolean().default(false),
});

type FormData = z.infer<typeof schema>;

export function RecommendationForm({ professionalId }: { professionalId: string }) {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { highlyRecommended: false } });

  async function onSubmit(data: FormData) {
    try {
      setStatus("idle");
      await submitRecommendation(professionalId, data.content, data.highlyRecommended);
      setStatus("success");
      reset();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-sm text-green-800 dark:text-green-300">
        ✅ Thank you! Your recommendation has been submitted and is pending admin approval.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <Textarea
        {...register("content")}
        placeholder="Share your experience working with this professional…"
        rows={4}
        className="resize-none"
      />
      {errors.content && (
        <p className="text-xs text-red-600">{errors.content.message}</p>
      )}

      <label className="flex items-center gap-2.5 cursor-pointer select-none group">
        <input
          type="checkbox"
          {...register("highlyRecommended")}
          className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
        />
        <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-emerald-700 transition-colors">
          I highly recommend this professional
        </span>
      </label>

      {status === "error" && (
        <p className="text-xs text-red-600">{errorMsg}</p>
      )}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">
          Requires sign-in. Reviewed by admin before publishing.
        </p>
        <Button
          type="submit"
          disabled={isSubmitting}
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {isSubmitting ? "Submitting…" : "Submit"}
        </Button>
      </div>
    </form>
  );
}
