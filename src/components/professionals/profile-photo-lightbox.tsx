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

  return (
    <>
      {/* Avatar banner — consistent regardless of portrait, logo, or landscape photo */}
      <div className="w-full h-28 bg-gradient-to-br from-emerald-600 to-green-700 rounded-t-2xl" />
      <div className="flex justify-center -mt-14 mb-1 px-4">
        {photoUrl ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="h-28 w-28 rounded-full ring-4 ring-white dark:ring-gray-900 overflow-hidden shadow-md focus-visible:outline-none focus-visible:ring-emerald-500 group flex-shrink-0"
            aria-label={`Open full size profile photo for ${name}`}
          >
            <img
              src={photoUrl}
              alt={name}
              className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.06]"
            />
          </button>
        ) : (
          <div className="h-28 w-28 rounded-full ring-4 ring-white dark:ring-gray-900 shadow-md bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-4xl select-none">{initials}</span>
          </div>
        )}
      </div>

      {photoUrl && (
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
      )}
    </>
  );
}
