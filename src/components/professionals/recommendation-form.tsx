"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Star, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitRecommendation } from "@/lib/actions/recommendations";

const schema = z.object({
  content: z.string().min(20, "Please write at least 20 characters").max(500, "Maximum 500 characters"),
  rating: z.number().min(1).max(5),
  highlyRecommended: z.boolean(),
});

type FormData = z.infer<typeof schema>;

const STAR_LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

interface Props {
  professionalId: string;
  isLoggedIn: boolean;
}

export function RecommendationForm({ professionalId, isLoggedIn }: Props) {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [hoverRating, setHoverRating] = useState(0);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { highlyRecommended: false, rating: 0 },
  });

  const rating = watch("rating");
  const content = watch("content") ?? "";

  async function onSubmit(data: FormData) {
    try {
      setStatus("idle");
      await submitRecommendation(professionalId, data.content, data.highlyRecommended, data.rating);
      setStatus("success");
      reset();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-sm text-green-800 dark:text-green-300 flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 flex-shrink-0" /> Thank you! Your recommendation has been submitted and is pending admin approval.
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-900/10 px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Have you worked with this professional?{" "}
          <span className="font-medium text-gray-800 dark:text-gray-200">Sign in to leave a review.</span>
        </p>
        <Link href={`/auth/login?redirectTo=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "")}`}>
          <Button size="sm" className="flex-shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white">
            Sign in to review
          </Button>
        </Link>
      </div>
    );
  }

  const displayRating = hoverRating || rating;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Star picker */}
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Your rating</p>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setValue("rating", star, { shouldValidate: true })}
              className="p-0.5 focus:outline-none"
              aria-label={`${star} star${star !== 1 ? "s" : ""}`}
            >
              <Star
                className={`h-7 w-7 transition-colors ${
                  star <= displayRating
                    ? "fill-amber-400 text-amber-400"
                    : "fill-gray-100 text-gray-300 dark:fill-gray-700 dark:text-gray-600"
                }`}
              />
            </button>
          ))}
          {displayRating > 0 && (
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
              {STAR_LABELS[displayRating]}
            </span>
          )}
        </div>
        {errors.rating && <p className="text-xs text-red-600 mt-1">Please select a star rating</p>}
      </div>

      <Textarea
        {...register("content")}
        placeholder="Share your experience working with this professional…"
        rows={4}
        className="resize-none"
      />
      <div className="flex items-center justify-between -mt-2">
        {content.length < 20 ? (
          <p className="text-xs text-gray-400">
            Please write at least <span className="font-medium text-gray-600 dark:text-gray-300">{20 - content.length}</span> more character{20 - content.length !== 1 ? "s" : ""}
          </p>
        ) : (
          <p className="text-xs text-gray-400" />
        )}
        <p className={`text-xs ${content.length > 480 ? "text-amber-600" : "text-gray-400"}`}>
          {content.length}/500
        </p>
      </div>
      {errors.content && <p className="text-xs text-red-600 -mt-2">{errors.content.message}</p>}

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

      {status === "error" && <p className="text-xs text-red-600">{errorMsg}</p>}

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">Reviewed by admin before publishing.</p>
        <Button
          type="submit"
          disabled={isSubmitting || rating === 0}
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {isSubmitting ? "Submitting…" : "Submit Review"}
        </Button>
      </div>
    </form>
  );
}
