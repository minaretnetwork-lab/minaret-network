"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { saveProfilePhotoFraming } from "@/lib/actions/profile-photo-framing";
import { DEFAULT_PHOTO_FRAMING, getPhotoFraming, photoOverflow, type PhotoFraming } from "@/lib/profile-photo-framing";

interface ProfilePhotoLightboxProps {
  photoUrl: string | null;
  name: string;
  initials: string;
  professionalId: string;
  canEdit?: boolean;
  photoFraming?: unknown;
}

export function ProfilePhotoLightbox({
  photoUrl,
  name,
  initials,
  professionalId,
  canEdit = false,
  photoFraming,
}: ProfilePhotoLightboxProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<PhotoFraming>(DEFAULT_PHOTO_FRAMING);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [imageRatio, setImageRatio] = useState(4 / 3);
  const drag = useRef<{ pointerId: number; x: number; y: number; frame: PhotoFraming } | null>(null);
  const saved = getPhotoFraming(photoFraming, photoUrl);
  const imageStyle = (frame: PhotoFraming) => ({
    objectPosition: `${frame.x}% ${frame.y}%`,
    transform: `scale(${frame.zoom})`,
    transformOrigin: `${frame.x}% ${frame.y}%`,
  });

  function openPhoto() {
    if (canEdit) {
      setDraft(saved);
      setError(null);
      setEditing(true);
    } else setOpen(true);
  }

  function save() {
    if (!photoUrl) return;
    setError(null);
    startTransition(async () => {
      try {
        const result = await saveProfilePhotoFraming(professionalId, photoUrl, draft);
        if (!result.ok) setError(result.error ?? "Could not save the photo framing.");
        else setEditing(false);
      } catch {
        setError("Could not save the photo framing. Please try again.");
      }
    });
  }

  return (
    <>
      {/* Fill the profile frame; the lightbox preserves the complete image. */}
      <div className="p-4 pb-0">
        {photoUrl ? (
          <button
            type="button"
            onClick={openPhoto}
            className="relative block aspect-[4/3] w-full cursor-zoom-in overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
            aria-label={canEdit ? `Edit profile photo framing for ${name}` : `Open full size profile photo for ${name}`}
          >
            <Image
              unoptimized
              fill
              sizes="(min-width: 1024px) 280px, (min-width: 640px) 600px, 100vw"
              src={photoUrl}
              alt={name}
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
              className="object-cover object-center select-none pointer-events-none"
              style={imageStyle(saved)}
            />
            {canEdit && (
              <span className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-900 shadow-md ring-1 ring-black/10">
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </span>
            )}
          </button>
        ) : (
          <div className="aspect-[4/3] w-full rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
            <span className="text-white font-bold text-4xl select-none">{initials}</span>
          </div>
        )}
      </div>

      {photoUrl && canEdit && (
        <Dialog open={editing} onOpenChange={(value) => { if (!pending) setEditing(value); }}>
          <DialogContent className="sm:max-w-xl max-h-[90dvh] overflow-y-auto">
            <DialogTitle>Adjust profile photo</DialogTitle>
            <DialogDescription>Drag the photo to reposition it, or use the controls below. This preview is what visitors will see.</DialogDescription>
            <div
              className="relative aspect-[4/3] w-full touch-none overflow-hidden rounded-xl bg-gray-950 cursor-grab active:cursor-grabbing"
              onPointerDown={(event) => {
                if (pending || event.button !== 0) return;
                event.currentTarget.setPointerCapture(event.pointerId);
                drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, frame: { ...draft } };
              }}
              onPointerMove={(event) => {
                const start = drag.current;
                if (!start || start.pointerId !== event.pointerId || pending) return;
                const bounds = event.currentTarget.getBoundingClientRect();
                const overflow = photoOverflow(bounds.width, bounds.height, imageRatio, start.frame.zoom);
                const clamp = (value: number) => Math.max(0, Math.min(100, value));
                setDraft({ ...start.frame,
                  x: overflow.x > 0.5 ? clamp(start.frame.x - (event.clientX - start.x) / overflow.x * 100) : start.frame.x,
                  y: overflow.y > 0.5 ? clamp(start.frame.y - (event.clientY - start.y) / overflow.y * 100) : start.frame.y,
                });
              }}
              onPointerUp={() => { drag.current = null; }}
              onPointerCancel={() => { drag.current = null; }}
              onLostPointerCapture={() => { drag.current = null; }}
            >
              <Image unoptimized fill src={photoUrl} alt={`Framing preview for ${name}`} sizes="560px"
                draggable={false} className="object-cover pointer-events-none select-none" style={imageStyle(draft)}
                onLoad={(event) => {
                  const image = event.currentTarget;
                  if (image.naturalHeight) setImageRatio(image.naturalWidth / image.naturalHeight);
                }} />
            </div>
            {([
              { key: "zoom", label: "Zoom", min: 1, max: 3, step: 0.01 },
              { key: "x", label: "Horizontal position", min: 0, max: 100, step: 1 },
              { key: "y", label: "Vertical position", min: 0, max: 100, step: 1 },
            ] as const).map(({ key, label, min, max, step }) => (
              <label key={key} className="grid gap-2 text-sm font-medium">
                <span className="flex justify-between"><span>{label}</span><span>{key === "zoom" ? `${draft[key].toFixed(2)}×` : `${Math.round(draft[key])}%`}</span></span>
                <input type="range" min={min} max={max} step={step} value={draft[key]} disabled={pending}
                  className="w-full accent-emerald-600" onChange={(event) => setDraft((frame) => ({ ...frame, [key]: Number(event.target.value) }))} />
              </label>
            ))}
            {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="ghost" disabled={pending} onClick={() => setDraft({ ...DEFAULT_PHOTO_FRAMING })}>Reset</Button>
              <Button variant="outline" disabled={pending} onClick={() => setEditing(false)}>Cancel</Button>
              <Button disabled={pending} onClick={save}>{pending ? "Saving…" : "Save framing"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {photoUrl && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent
            className="max-w-3xl border-0 bg-transparent p-0 shadow-none ring-0"
            showCloseButton={false}
          >
            <DialogTitle className="sr-only">Profile photo for {name}</DialogTitle>
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
