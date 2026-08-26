"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { ZoomIn, ZoomOut, X, Maximize2, RotateCcw } from "lucide-react";

export function EventImageViewer({ src, alt }: { src: string; alt: string }) {
  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [origin, setOrigin] = useState({ x: 50, y: 50 }); // % transform-origin
  const containerRef = useRef<HTMLDivElement>(null);

  const MIN = 1;
  const MAX = 5;
  const STEP = 0.5;

  const zoomIn  = () => setScale((s) => Math.min(s + STEP, MAX));
  const zoomOut = () => setScale((s) => Math.max(s - STEP, MIN));
  const reset   = () => { setScale(1); setOrigin({ x: 50, y: 50 }); };

  // Scroll-wheel zoom inside modal
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    setScale((s) => Math.min(Math.max(s - e.deltaY * 0.005, MIN), MAX));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!open || !el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [open, handleWheel]);

  // Click-to-zoom-origin inside modal
  function handleImageClick(e: React.MouseEvent<HTMLDivElement>) {
    if (scale >= MAX) { reset(); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin({ x, y });
    setScale((s) => Math.min(s + STEP, MAX));
  }

  // ESC to close
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") { setOpen(false); reset(); } }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Trigger — magnifier overlay on the image */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="absolute bottom-2 right-2 z-10 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1.5 text-white text-xs font-medium hover:bg-black/80 transition backdrop-blur-sm"
        aria-label="View full image"
      >
        <Maximize2 className="h-3.5 w-3.5" />
        View
      </button>

      {/* Lightbox */}
      {open && (
        <div className="fixed inset-0 z-[200] flex flex-col bg-black/95 backdrop-blur-sm">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
            <p className="text-sm text-white/70 truncate max-w-xs">{alt}</p>
            <div className="flex items-center gap-2">
              <button
                onClick={zoomOut}
                disabled={scale <= MIN}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-30 transition"
                aria-label="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                onClick={reset}
                className="flex h-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 px-3 text-xs transition"
                aria-label="Reset zoom"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                {Math.round(scale * 100)}%
              </button>
              <button
                onClick={zoomIn}
                disabled={scale >= MAX}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-30 transition"
                aria-label="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                onClick={() => { setOpen(false); reset(); }}
                className="ml-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-red-500 transition"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Image area */}
          <div
            ref={containerRef}
            className="flex-1 overflow-hidden flex items-center justify-center"
            style={{ cursor: scale >= MAX ? "zoom-out" : "zoom-in" }}
            onClick={handleImageClick}
          >
            <div
              style={{
                transform: `scale(${scale})`,
                transformOrigin: `${origin.x}% ${origin.y}%`,
                transition: "transform 0.2s ease",
                position: "relative",
                width: "min(90vw, 90vh)",
                height: "min(90vw, 90vh)",
              }}
            >
              <Image
                src={src}
                alt={alt}
                fill
                className="object-contain select-none"
                sizes="90vw"
                priority
                draggable={false}
              />
            </div>
          </div>

          {/* Hint */}
          <p className="text-center text-xs text-white/30 py-2 flex-shrink-0">
            Click image to zoom · Scroll wheel · ESC to close
          </p>
        </div>
      )}
    </>
  );
}
