"use client";

import { useState } from "react";
import { toggleMosqueAffiliationVisibility } from "@/lib/actions/professionals";
import { Eye, EyeOff } from "lucide-react";

interface Props {
  professionalId: string;
  initialVisible: boolean;
  mosqueName: string;
}

export function AffiliationVisibilityToggle({ professionalId, initialVisible, mosqueName }: Props) {
  const [visible, setVisible] = useState(initialVisible);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      await toggleMosqueAffiliationVisibility(professionalId, !visible);
      setVisible((v) => !v);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-start gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3 text-sm">
      <div className="flex-1">
        <p className="font-medium text-gray-800 dark:text-gray-200 text-xs">Mosque affiliation — {mosqueName}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {visible
            ? "Currently shown publicly on your listing."
            : "Currently hidden from your public listing."}
        </p>
      </div>
      <button
        onClick={toggle}
        disabled={busy}
        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
          visible
            ? "border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
            : "border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400"
        }`}
      >
        {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        {busy ? "Saving…" : visible ? "Hide" : "Show"}
      </button>
    </div>
  );
}
