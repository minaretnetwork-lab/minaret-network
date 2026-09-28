"use client";

import Link from "next/link";
import { ChevronDown, Star, Tag, Megaphone } from "lucide-react";

const ITEMS = [
  {
    href: "/auth/login?next=/dashboard/featured",
    icon: Star,
    label: "Feature Your Business",
    description: "Homepage placement — max visibility",
  },
  {
    href: "/auth/login?next=/dashboard/promote",
    icon: Tag,
    label: "Sponsored Listing",
    description: "Top of search in your category",
  },
  {
    href: "/auth/login?next=/dashboard/offers",
    icon: Megaphone,
    label: "Community Offer",
    description: "Time-limited deal or promotion",
  },
];

export function AdvertiseDropdown({ open, onOpen, onScheduleClose, onToggle, onClose }: {
  open: boolean;
  onOpen: () => void;
  onScheduleClose: () => void;
  onToggle: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="relative"
      onMouseEnter={onOpen}
      onMouseLeave={onScheduleClose}
    >
      <button
        onClick={onToggle}
        className="flex items-center gap-1 whitespace-nowrap px-3 py-2 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all"
        aria-expanded={open}
      >
        Advertise with Us
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-64 rounded-xl border border-white/10 bg-[#14532d] shadow-xl overflow-hidden z-50">
          {ITEMS.map(({ href, icon: Icon, label, description }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className="flex items-start gap-3 px-4 py-3 hover:bg-white/10 transition-colors"
            >
              <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-white/10">
                <Icon className="h-4 w-4 text-emerald-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{label}</p>
                <p className="text-xs text-white/60 mt-0.5">{description}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
