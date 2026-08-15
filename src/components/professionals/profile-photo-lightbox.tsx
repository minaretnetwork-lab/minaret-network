"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
      <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-green-100">
        <AvatarFallback className="bg-green-100 text-green-700 font-bold text-2xl">
          {initials}
        </AvatarFallback>
      </Avatar>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mx-auto mb-4 block rounded-full transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        aria-label={`Open full size profile photo for ${name}`}
      >
        <Avatar className="h-24 w-24 border-4 border-green-100 shadow-sm">
          <AvatarImage src={photoUrl} alt={name} className="object-cover" />
          <AvatarFallback className="bg-green-100 text-green-700 font-bold text-2xl">
            {initials}
          </AvatarFallback>
        </Avatar>
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
