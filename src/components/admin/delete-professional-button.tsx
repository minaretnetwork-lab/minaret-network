"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { deleteProfessional } from "@/lib/actions/admin";

export function DeleteProfessionalButton({ professionalId, name }: { professionalId: string; name: string }) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    startTransition(async () => {
      await deleteProfessional(professionalId);
      router.push("/admin/professionals");
    });
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-red-600 dark:text-red-400">Delete &ldquo;{name}&rdquo;?</span>
        <Button
          size="sm"
          onClick={handleDelete}
          disabled={isPending}
          className="bg-red-600 hover:bg-red-700 text-white gap-1.5"
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          Yes, delete
        </Button>
        <Button size="sm" variant="outline" onClick={() => setConfirming(false)} disabled={isPending}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => setConfirming(true)}
      className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-900/20"
    >
      <Trash2 className="h-4 w-4" />
      Delete
    </Button>
  );
}
