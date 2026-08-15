export function MinaretIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 44"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Finial ball */}
      <circle cx="12" cy="2.5" r="2" />
      {/* Spire */}
      <path d="M12 0.5 L9 10 L15 10 Z" />
      {/* Collar ring */}
      <rect x="8" y="10" width="8" height="2" rx="1" />
      {/* Upper tower */}
      <rect x="9.5" y="12" width="5" height="10" rx="0.5" />
      {/* Balcony */}
      <rect x="6" y="22" width="12" height="2.5" rx="1" />
      {/* Lower tower */}
      <rect x="9" y="24.5" width="6" height="9" rx="0.5" />
      {/* Base tier 1 */}
      <rect x="5.5" y="33.5" width="13" height="3" rx="1" />
      {/* Base tier 2 */}
      <rect x="3" y="36.5" width="18" height="3.5" rx="1" />
    </svg>
  );
}

interface MinaretLogoProps {
  /** Show full horizontal lockup with text. False = icon only. */
  withText?: boolean;
  className?: string;
}

export function MinaretLogo({ withText = true, className }: MinaretLogoProps) {
  if (!withText) return <MinaretIcon className={className} />;

  return (
    <div className={`flex items-center gap-3 ${className ?? ""}`}>
      <MinaretIcon className="h-9 w-auto text-white" />
      <div>
        <p className="text-[15px] font-bold leading-none" style={{ fontFamily: "var(--font-lora)" }}>
          <span className="text-white">Minaret </span>
          <span className="text-white/60">Network</span>
        </p>
        <p className="text-[9px] text-white/40 leading-none mt-1 tracking-[0.18em] uppercase">
          Mosque Professionals
        </p>
      </div>
    </div>
  );
}
