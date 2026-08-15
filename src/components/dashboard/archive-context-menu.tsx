"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Archive, ArchiveRestore } from "lucide-react";

const CONTEXT_MENU_OPEN_EVENT = "minaret:archive-context-menu-open";

export function ArchiveContextMenu({
  children,
  archived,
  enabled = true,
  disabled = false,
  onSelect,
}: {
  children: ReactNode;
  archived: boolean;
  enabled?: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [menuId] = useState(() => Symbol("archive-context-menu"));

  useEffect(() => {
    const closeWhenAnotherMenuOpens = (event: Event) => {
      if ((event as CustomEvent<symbol>).detail !== menuId) setPosition(null);
    };
    window.addEventListener(CONTEXT_MENU_OPEN_EVENT, closeWhenAnotherMenuOpens);

    return () => {
      window.removeEventListener(CONTEXT_MENU_OPEN_EVENT, closeWhenAnotherMenuOpens);
    };
  }, [menuId]);

  useEffect(() => {
    if (!position) return;

    const close = () => setPosition(null);
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    window.addEventListener("click", close);
    window.addEventListener("scroll", close, true);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [position]);

  return (
    <div
      onContextMenu={(event) => {
        if (!enabled || window.innerWidth < 768) return;
        event.preventDefault();
        window.dispatchEvent(new CustomEvent(CONTEXT_MENU_OPEN_EVENT, { detail: menuId }));
        setPosition({
          x: Math.min(event.clientX, window.innerWidth - 180),
          y: Math.min(event.clientY, window.innerHeight - 60),
        });
      }}
    >
      {children}
      {position && (
        <div
          role="menu"
          className="fixed z-50 min-w-44 rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl dark:border-gray-700 dark:bg-gray-900"
          style={{ left: position.x, top: position.y }}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            role="menuitem"
            disabled={disabled}
            onClick={() => {
              setPosition(null);
              onSelect();
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-wait disabled:opacity-60 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            {archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
            {archived ? "Restore" : "Archive"}
          </button>
        </div>
      )}
    </div>
  );
}
