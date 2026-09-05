"use client";

import { useState, useMemo } from "react";
import { REGION_MAP, REGIONS } from "@/lib/constants";
import { Input } from "@/components/ui/input";

interface ServiceArea {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  serviceAreas: ServiceArea[];
  value: string[];
  onChange: (ids: string[]) => void;
  error?: string;
}

export function ServiceAreaPicker({ serviceAreas, value, onChange, error }: Props) {
  const [search, setSearch] = useState("");

  const normalizedSearch = search.trim().toLowerCase();

  // Group areas by region; unrecognized slugs go to "Other"
  const grouped = useMemo(() => {
    const byRegion: Record<string, ServiceArea[]> = {};
    for (const region of REGIONS) byRegion[region] = [];
    byRegion["Other"] = [];

    for (const area of serviceAreas) {
      const region = REGION_MAP[area.slug] ?? "Other";
      if (!byRegion[region]) byRegion[region] = [];
      byRegion[region].push(area);
    }

    return byRegion;
  }, [serviceAreas]);

  const visibleAreas = useMemo(() => {
    if (!normalizedSearch) return null; // no filter — show grouped view
    return serviceAreas.filter(
      (a) => a.name.toLowerCase().includes(normalizedSearch) || value.includes(a.id),
    );
  }, [serviceAreas, normalizedSearch, value]);

  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  }

  function selectRegion(region: string) {
    const regionIds = (grouped[region] ?? []).map((a) => a.id);
    const allSelected = regionIds.every((id) => value.includes(id));
    if (allSelected) {
      onChange(value.filter((id) => !regionIds.includes(id)));
    } else {
      const next = new Set(value);
      for (const id of regionIds) next.add(id);
      onChange([...next]);
    }
  }

  function isRegionFullySelected(region: string) {
    const ids = (grouped[region] ?? []).map((a) => a.id);
    return ids.length > 0 && ids.every((id) => value.includes(id));
  }

  function isRegionPartiallySelected(region: string) {
    const ids = (grouped[region] ?? []).map((a) => a.id);
    return ids.some((id) => value.includes(id)) && !ids.every((id) => value.includes(id));
  }

  const regionLabels: Record<string, string> = {
    "York North": "York Region North",
    "York South": "York Region South",
    "Toronto": "Toronto",
    "Peel": "Peel Region",
    "Durham": "Durham Region",
    "Halton": "Halton Region",
    "Beyond GTA": "Beyond GTA",
    "Other": "Other",
  };

  return (
    <div>
      <Input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-3 max-w-sm"
        placeholder="Type a city or area to filter..."
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(serviceAreas.map((a) => a.id))}
          className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
        >
          Select all
        </button>
        <button
          type="button"
          onClick={() => onChange([])}
          className="rounded-full border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Clear all
        </button>
        {value.length > 0 && (
          <span className="text-xs text-gray-400">
            {value.length} of {serviceAreas.length} selected
          </span>
        )}
      </div>

      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}

      {/* Flat filtered view */}
      {visibleAreas && (
        <>
          <div className="flex flex-wrap gap-2">
            {visibleAreas.map((area) => (
              <AreaPill key={area.id} area={area} selected={value.includes(area.id)} onToggle={toggle} />
            ))}
          </div>
          {visibleAreas.length === 0 && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No service areas match that search.</p>
          )}
        </>
      )}

      {/* Grouped view (no search active) */}
      {!visibleAreas && (
        <div className="space-y-4">
          {[...REGIONS, "Other"].map((region) => {
            const areas = grouped[region];
            if (!areas || areas.length === 0) return null;
            const fully = isRegionFullySelected(region);
            const partial = isRegionPartiallySelected(region);
            return (
              <div key={region}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {regionLabels[region] ?? region}
                  </span>
                  <button
                    type="button"
                    onClick={() => selectRegion(region)}
                    className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-colors ${
                      fully
                        ? "border-emerald-300 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:border-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                        : partial
                        ? "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                        : "border-gray-200 bg-white text-gray-500 hover:border-emerald-300 hover:text-emerald-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400"
                    }`}
                  >
                    {fully ? "Deselect all" : "Select all"}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {areas.map((area) => (
                    <AreaPill key={area.id} area={area} selected={value.includes(area.id)} onToggle={toggle} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AreaPill({ area, selected, onToggle }: { area: ServiceArea; selected: boolean; onToggle: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(area.id)}
      className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
        selected
          ? "bg-emerald-600 text-white border-emerald-600"
          : "border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300 hover:border-emerald-400"
      }`}
    >
      {area.name}
    </button>
  );
}
