"use client";

import { useCallback } from "react";
import { incrementContactClick } from "@/lib/actions/sponsored";

type ContactType = "phone" | "email" | "whatsapp";

function dedupKey(professionalId: string, type: ContactType) {
  return `contact_click_${professionalId}_${type}`;
}

function useTrackContact(professionalId: string) {
  return useCallback((type: ContactType) => {
    const key = dedupKey(professionalId, type);
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {}
    incrementContactClick(professionalId, type).catch(() => {});
  }, [professionalId]);
}

interface Props {
  professionalId: string;
  phone?: string | null;
  email?: string | null;
  whatsappHref?: string | null;
  children: (track: (type: ContactType) => void) => React.ReactNode;
}

export function ContactTracker({ professionalId, children }: Props) {
  const track = useTrackContact(professionalId);
  return <>{children(track)}</>;
}
