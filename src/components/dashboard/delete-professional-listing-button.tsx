"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteProfessionalListing } from "@/lib/actions/professionals";

type Props = {
  professionalId: string;
  status: string;
  label: string;
};

export function DeleteProfessionalListingButton({ professionalId, status, label }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isLive = status === "APPROVED";
  const canDelete = !isLive || confirmText === "DELETE";

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteProfessionalListing(professionalId, isLive ? confirmText : "");
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setIsOpen(false);
      setConfirmText("");
      router.refresh();
    });
  }

  if (!isOpen) {
    return (
      <Button
        type="button"
        variant="destructive"
        size="sm"
        className="gap-1.5"
        onClick={() => setIsOpen(true)}
      >
        <Trash2 className="h-3.5 w-3.5" />
        Delete
      </Button>
    );
  }

  return (
    <div className="w-full rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">Delete {label}?</p>
          <p className="mt-1 text-red-700 dark:text-red-300">
            {isLive
              ? "This is a live public listing. Deleting it will remove it from search results and clear related listing data."
              : "This will remove the application from your professional listings."}
          </p>
        </div>
        <button
          type="button"
          className="rounded-full p-1 text-red-500 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/40"
          onClick={() => {
            setIsOpen(false);
            setConfirmText("");
            setError(null);
          }}
          aria-label="Cancel delete"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {isLive && (
        <label className="mt-3 block">
          <span className="text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-red-300">
            Type DELETE to confirm
          </span>
          <input
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            className="mt-1 w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 dark:border-red-900/60 dark:bg-gray-950 dark:text-white dark:focus:ring-red-950"
            placeholder="DELETE"
          />
        </label>
      )}

      {error && <p className="mt-3 rounded-lg bg-white/70 px-3 py-2 text-xs font-medium text-red-700 dark:bg-red-950/40 dark:text-red-200">{error}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={!canDelete || isPending}
          onClick={handleDelete}
        >
          {isPending ? "Deleting..." : isLive ? "Delete live listing" : "Delete application"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setIsOpen(false);
            setConfirmText("");
            setError(null);
          }}
        >
          Keep it
        </Button>
      </div>
    </div>
  );
}
