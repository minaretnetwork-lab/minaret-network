"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ProfilePhotoLightboxProps {
  photoUrl: string | null;
  name: string;
  initials: string;
}

export function ProfilePhotoLightbox({
  photoUrl,
  name,
  initials,
}: ProfilePhotoLightboxProps) {
  const [open, setOpen] = useState(false);

  if (!photoUrl) {
    return (
      <div className="w-full h-52 rounded-t-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
        <span className="text-white font-bold text-5xl select-none">{initials}</span>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full h-52 block overflow-hidden rounded-t-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-inset group"
        aria-label={`Open full size profile photo for ${name}`}
      >
        <img
          src={photoUrl}
          alt={name}
          className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-3xl border-0 bg-transparent p-0 shadow-none ring-0"
          showCloseButton={false}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full cursor-zoom-out rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
            aria-label={`Close full size profile photo for ${name}`}
          >
            <img
              src={photoUrl}
              alt={name}
              className="max-h-[85vh] w-full rounded-2xl object-contain shadow-2xl"
            />
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}
