export function CommunityCycle() {
  return (
    <section className="py-12 md:py-24 bg-[#f7f8f5] dark:bg-gray-950">
      <div className="container mx-auto px-4 lg:px-6">

        <div className="text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-3">The bigger picture</p>
          <h2
            className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            The Community Circle
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            When the community hires together, everyone grows.
          </p>
        </div>

        {/* Mobile fallback — simple list */}
        <div className="sm:hidden max-w-xs mx-auto space-y-4 mb-6">
          {[
            { label: "You", sub: "Find trusted help", emoji: "🤝" },
            { label: "Professional", sub: "Earns within the ummah", emoji: "💼" },
            { label: "Masjid", sub: "Community strengthens", emoji: "🕌" },
          ].map((node, i) => (
            <div key={node.label} className="flex items-center gap-4 bg-white dark:bg-gray-900 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-4">
              <div className="h-12 w-12 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-2xl flex-shrink-0">{node.emoji}</div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm" style={{ fontFamily: "Georgia,serif" }}>{node.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{node.sub}</p>
              </div>
              {i < 2 && <div className="ml-auto text-emerald-400 text-lg">↓</div>}
            </div>
          ))}
        </div>

        <div className="hidden sm:block max-w-xl mx-auto">
          <svg viewBox="0 0 700 530" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <defs>
              <marker id="mn-arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#059669" />
              </marker>
            </defs>

            {/* ── ARCS ─────────────────────────────────────────────── */}
            {/* Arc 1: You → Professional (right side, CW) */}
            <path
              d="M 402 98 A 175 175 0 0 1 521 304"
              fill="none" stroke="#059669" strokeWidth="2.5" strokeDasharray="7 5"
              markerEnd="url(#mn-arrow)"
            />
            {/* Arc 2: Professional → Masjid (bottom, CW) */}
            <path
              d="M 469 394 A 175 175 0 0 1 231 394"
              fill="none" stroke="#059669" strokeWidth="2.5" strokeDasharray="7 5"
              markerEnd="url(#mn-arrow)"
            />
            {/* Arc 3: Masjid → You (left side, CW) */}
            <path
              d="M 179 304 A 175 175 0 0 1 298 98"
              fill="none" stroke="#059669" strokeWidth="2.5" strokeDasharray="7 5"
              markerEnd="url(#mn-arrow)"
            />

            {/* ── NODE: You (350, 90) ───────────────────────────────── */}
            <circle cx="350" cy="90" r="52" fill="#ecfdf5" stroke="#6ee7b7" strokeWidth="2" />
            {/* Person icon */}
            <g transform="translate(350, 83)" fill="#059669">
              <circle cx="0" cy="-11" r="9" />
              <path d="M-15 10 Q-15 -2 0 -2 Q15 -2 15 10 Z" />
            </g>
            <text x="350" y="158" textAnchor="middle" fontSize="15" fontWeight="700" fill="#064e3b" fontFamily="Georgia,serif">You</text>
            <text x="350" y="175" textAnchor="middle" fontSize="11" fill="#6b7280">Find trusted help</text>

            {/* ── NODE: Professional (502, 353) ────────────────────── */}
            <circle cx="502" cy="353" r="52" fill="#ecfdf5" stroke="#6ee7b7" strokeWidth="2" />
            {/* Briefcase icon */}
            <g transform="translate(502, 348)" stroke="#059669" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <rect x="-16" y="-7" width="32" height="21" rx="3" />
              <path d="M-8 -7 v-4 a1.5 1.5 0 0 1 1.5-1.5 h13 a1.5 1.5 0 0 1 1.5 1.5 v4" />
              <line x1="-16" y1="2" x2="16" y2="2" />
            </g>
            <text x="502" y="422" textAnchor="middle" fontSize="13" fontWeight="700" fill="#064e3b" fontFamily="Georgia,serif">Professional</text>
            <text x="502" y="439" textAnchor="middle" fontSize="11" fill="#6b7280">Earns within the ummah</text>

            {/* ── NODE: Masjid Community (198, 353) ────────────────── */}
            <circle cx="198" cy="353" r="52" fill="#ecfdf5" stroke="#6ee7b7" strokeWidth="2" />
            {/* Minaret / mosque icon */}
            <g transform="translate(198, 350)" fill="#059669">
              {/* Minaret tower */}
              <rect x="-3" y="-24" width="6" height="16" />
              <polygon points="0,-28 -5,-24 5,-24" />
              {/* Dome */}
              <path d="M-15 -8 Q-15 -20 0 -20 Q15 -20 15 -8 Z" />
              {/* Base */}
              <rect x="-18" y="-8" width="36" height="10" rx="1" />
              {/* Door arch */}
              <path d="M-4 2 Q-4 -3 0 -3 Q4 -3 4 2 Z" fill="#ecfdf5" />
            </g>
            <text x="198" y="422" textAnchor="middle" fontSize="13" fontWeight="700" fill="#064e3b" fontFamily="Georgia,serif">Masjid</text>
            <text x="198" y="439" textAnchor="middle" fontSize="11" fill="#6b7280">Community strengthens</text>

            {/* ── ARC LABELS ───────────────────────────────────────── */}
            {/* Right (You → Professional) */}
            <text x="567" y="202" textAnchor="middle" fontSize="11" fill="#9ca3af" fontStyle="italic">you hire from</text>
            <text x="567" y="216" textAnchor="middle" fontSize="11" fill="#9ca3af" fontStyle="italic">the community</text>
            {/* Bottom (Professional → Masjid) */}
            <text x="350" y="482" textAnchor="middle" fontSize="11" fill="#9ca3af" fontStyle="italic">they support the masjid</text>
            {/* Left (Masjid → You) */}
            <text x="133" y="202" textAnchor="middle" fontSize="11" fill="#9ca3af" fontStyle="italic">community</text>
            <text x="133" y="216" textAnchor="middle" fontSize="11" fill="#9ca3af" fontStyle="italic">looks after you</text>
          </svg>
        </div>

        <p className="text-center text-emerald-700 dark:text-emerald-400 font-semibold text-lg mt-2">
          And the circle holds. That is the Minaret way.
        </p>

      </div>
    </section>
  );
}
