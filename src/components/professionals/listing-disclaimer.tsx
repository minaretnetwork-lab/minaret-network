"use client";

import { useState } from "react";
import { Info, ChevronDown, ChevronUp } from "lucide-react";

export function ListingDisclaimer() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-900/10">
      <div className="container mx-auto px-4 lg:px-6 py-3">
        {/* Tier 1 — always visible */}
        <div className="flex items-start gap-2">
          <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-amber-700 dark:text-amber-400" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
              <span className="font-semibold">Professionals listed here self-report their credentials and mosque affiliation.</span>{" "}
              Minaret Network does not verify, endorse, or guarantee any professional — please do your own checks before hiring.
            </p>

            {/* Tier 2 — expandable */}
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 transition-colors"
            >
              {expanded ? (
                <><ChevronUp className="h-3 w-3" /> Show less</>
              ) : (
                <><ChevronDown className="h-3 w-3" /> Learn more</>
              )}
            </button>

            {expanded && (
              <div className="mt-2 text-xs text-amber-800 dark:text-amber-300 leading-relaxed space-y-2 border-t border-amber-200 dark:border-amber-800/50 pt-2">
                <p>
                  Listings on Minaret Network are created and maintained by the professionals themselves. Mosque affiliation, credentials, licences, and years of experience shown here have not been independently verified by Minaret Network unless a listing explicitly says so.
                </p>
                <p>
                  A listed mosque affiliation is not an endorsement by that mosque, and appearing on this platform is not an endorsement by Minaret Network. Before hiring anyone, confirm their licensing, insurance, and qualifications yourself.
                </p>
                <p>
                  If location-based results are shown, distances are approximate and may be based on either your device&apos;s location or a manually entered address.
                </p>
                <p>
                  <span className="font-semibold">Sponsored listings:</span> Professionals may pay to appear in the &ldquo;Sponsored&rdquo; section. Sponsored placement is a commercial arrangement and is not an endorsement of quality or credentials.
                </p>
                <p>
                  <span className="font-semibold">AI-assisted matching:</span> Where an AI assistant is used to suggest professionals or match requests, those results are generated automatically and may be incomplete or inaccurate — treat them as a starting point, not a recommendation.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
