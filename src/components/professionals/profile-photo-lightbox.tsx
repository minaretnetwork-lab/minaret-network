"use client";

import { useState } from "react";
import Image from "next/image";
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
      {/* Keep the full portrait, logo, or landscape photo visible in a roomy frame. */}
      <div className="p-4 pb-0">
        {photoUrl ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="relative block aspect-[4/3] w-full cursor-zoom-in overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
            aria-label={`Open full size profile photo for ${name}`}
          >
            <Image
              unoptimized
              fill
              sizes="(min-width: 1024px) 280px, (min-width: 640px) 600px, 100vw"
              src={photoUrl}
              alt={name}
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
              className="object-contain object-center p-2 select-none pointer-events-none"
            />
          </button>
        ) : (
          <div className="aspect-[4/3] w-full rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
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
              onContextMenu={(e) => e.preventDefault()}
            >
              <div
                role="img"
                aria-label={name}
                style={{ backgroundImage: `url(${photoUrl})` }}
                className="max-h-[85vh] w-full rounded-2xl shadow-2xl aspect-[4/3] bg-contain bg-no-repeat bg-center select-none"
              />
            </button>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
