"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";

interface GalleryImage {
  id: string;
  url: string;
  caption: string | null;
}

interface Props {
  images: GalleryImage[];
}

export function GalleryLightbox({ images }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const isOpen = openIndex !== null;
  const current = openIndex !== null ? images[openIndex] : null;

  const prev = useCallback(() => {
    setOpenIndex((i) => (i !== null ? (i - 1 + images.length) % images.length : null));
  }, [images.length]);

  const next = useCallback(() => {
    setOpenIndex((i) => (i !== null ? (i + 1) % images.length : null));
  }, [images.length]);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, prev, next]);

  return (
    <>
      {/* Thumbnail grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {images.map((img, i) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setOpenIndex(i)}
            className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            aria-label={img.caption ? `View: ${img.caption}` : `View image ${i + 1}`}
          >
            <img
              src={img.url}
              alt={img.caption ?? `Gallery image ${i + 1}`}
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
            {/* hover overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/25 transition-colors duration-200">
              <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 drop-shadow" />
            </div>
            {img.caption && (
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                <p className="text-white text-[11px] leading-tight truncate">{img.caption}</p>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) setOpenIndex(null); }}>
        <DialogContent
          className="max-w-5xl border-0 bg-black/90 p-0 shadow-none ring-0 overflow-hidden"
          showCloseButton={false}
        >
          {current && (
            <div className="relative flex items-center justify-center min-h-[40vh] max-h-[90vh]">
              {/* Close */}
              <button
                type="button"
                onClick={() => setOpenIndex(null)}
                className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Prev */}
              {images.length > 1 && (
                <button
                  type="button"
                  onClick={prev}
                  className="absolute left-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}

              {/* Image */}
              <img
                key={current.id}
                src={current.url}
                alt={current.caption ?? "Gallery image"}
                className="max-h-[85vh] max-w-full object-contain select-none"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
              />

              {/* Next */}
              {images.length > 1 && (
                <button
                  type="button"
                  onClick={next}
                  className="absolute right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}

              {/* Caption + counter */}
              {(current.caption || images.length > 1) && (
                <div className="absolute bottom-0 inset-x-0 flex items-end justify-between gap-4 bg-gradient-to-t from-black/70 to-transparent px-5 py-4">
                  <p className="text-white/90 text-sm leading-snug flex-1 min-w-0">
                    {current.caption ?? ""}
                  </p>
                  {images.length > 1 && (
                    <span className="flex-shrink-0 text-white/60 text-xs tabular-nums">
                      {(openIndex ?? 0) + 1} / {images.length}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
