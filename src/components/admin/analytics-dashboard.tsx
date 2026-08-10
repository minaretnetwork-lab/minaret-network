"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, MapPin, Search, TrendingUp } from "lucide-react";

type SeriesPoint = { label: string; value: number };
type CountItem = { label: string; count: number };
type PopularListing = {
  id: string;
  name: string;
  category: string;
  profileViews: number;
};

type AnalyticsData = {
  visitors: {
    hourly: SeriesPoint[];
    daily: SeriesPoint[];
    monthly: SeriesPoint[];
  };
  topRegions: CountItem[];
  topSearchTerms: CountItem[];
  popularListings: PopularListing[];
  totals: {
    searches: number;
    visitors: number;
    listingViews: number;
  };
};

const RANGE_OPTIONS = [
  { key: "hourly", label: "24 hours", title: "Visitors per hour" },
  { key: "daily", label: "7 days", title: "Visitors per day" },
  { key: "monthly", label: "12 months", title: "Visitors per month" },
] as const;

export function AnalyticsDashboard({ data }: { data: AnalyticsData }) {
  const [range, setRange] = useState<(typeof RANGE_OPTIONS)[number]["key"]>("hourly");
  const activeRange = RANGE_OPTIONS.find((option) => option.key === range) ?? RANGE_OPTIONS[0];
  const series = data.visitors[range];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Metric label="Tracked visitors" value={data.totals.visitors} />
        <Metric label="Home searches" value={data.totals.searches} />
        <Metric label="Listing views" value={data.totals.listingViews} />
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
              <BarChart3 className="h-4 w-4 text-emerald-600" />
              {activeRange.title}
            </h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Anonymous first-party page views, counted as unique visitors per bucket.
            </p>
          </div>
          <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-gray-800 dark:bg-gray-950">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setRange(option.key)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  range === option.key
                    ? "bg-white text-emerald-700 shadow-sm dark:bg-gray-800 dark:text-emerald-300"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <VisitorBars key={range} series={series} range={range} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RankedList
          icon={<MapPin className="h-4 w-4 text-emerald-600" />}
          title="Top searched regions"
          empty="No region searches tracked yet."
          items={data.topRegions}
        />
        <RankedList
          icon={<Search className="h-4 w-4 text-emerald-600" />}
          title="Top home search terms"
          empty="No homepage search terms tracked yet."
          items={data.topSearchTerms}
        />
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
          <TrendingUp className="h-4 w-4 text-emerald-600" />
          Most popular listings
        </h2>
        <div className="mt-4 space-y-3">
          {data.popularListings.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">No listing page views yet.</p>
          ) : (
            data.popularListings.map((listing, index) => (
              <Link
                key={listing.id}
                href={`/professionals/${listing.id}`}
                className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-3 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
              >
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-xs font-bold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-gray-900 dark:text-white">{listing.name}</span>
                  <span className="block truncate text-xs text-gray-500 dark:text-gray-400">{listing.category}</span>
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{listing.profileViews}</span>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{value.toLocaleString("en-CA")}</p>
    </div>
  );
}

function VisitorBars({ series, range }: { series: SeriesPoint[]; range: (typeof RANGE_OPTIONS)[number]["key"] }) {
  const [selectedLabel, setSelectedLabel] = useState<string | null>(series.at(-1)?.label ?? null);
  const max = Math.max(...series.map((point) => point.value), 1);
  const chartMax = niceCeil(max);
  const yTicks = [chartMax, Math.round(chartMax / 2), 0];
  const selectedPoint = series.find((point) => point.label === selectedLabel) ?? series.at(-1) ?? null;
  const axisTicks = getAxisTicks(series, range);

  return (
    <div className="mt-5">
      <div className="grid grid-cols-[2rem_minmax(0,1fr)] gap-2 rounded-xl bg-gray-50 px-3 pb-4 pt-3 dark:bg-gray-950">
        <div className="flex h-48 flex-col justify-between text-right text-[10px] font-medium tabular-nums text-gray-400">
          {yTicks.map((tick) => (
            <span key={tick}>{tick.toLocaleString("en-CA")}</span>
          ))}
        </div>
        <div className="relative flex h-48 items-end gap-1.5">
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
            {yTicks.map((tick) => (
              <span key={tick} className="border-t border-gray-200/80 dark:border-gray-800" />
            ))}
          </div>
          {series.map((point) => {
            const height = Math.max((point.value / chartMax) * 100, point.value > 0 ? 8 : 2);
            const isSelected = selectedPoint?.label === point.label;
            return (
              <div key={point.label} className="group relative z-10 flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                <div className="relative flex h-full w-full items-end justify-center">
                  <button
                    type="button"
                    aria-label={`${point.label}: ${point.value} visitor${point.value === 1 ? "" : "s"}`}
                    aria-pressed={isSelected}
                    onClick={() => setSelectedLabel(point.label)}
                    className={`w-full max-w-8 rounded-t-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50 dark:focus-visible:ring-offset-gray-950 ${
                      isSelected
                        ? "bg-emerald-700 shadow-sm"
                        : "bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700"
                    }`}
                    style={{ height: `${height}%` }}
                  />
                  <span className="pointer-events-none absolute bottom-full mb-2 hidden rounded-md bg-gray-900 px-2 py-1 text-[11px] text-white shadow-lg group-hover:block">
                    {point.label}: {point.value} visitor{point.value === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="relative ml-10 mt-2 h-5 text-[10px] font-medium text-gray-400">
        {axisTicks.map((tick) => (
          <span
            key={`${tick.label}-${tick.index}`}
            className="absolute top-0 -translate-x-1/2 whitespace-nowrap"
            style={{ left: `${tick.left}%` }}
          >
            {tick.label}
          </span>
        ))}
      </div>
      {selectedPoint && (
        <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-100">
          {selectedPoint.label}: {selectedPoint.value.toLocaleString("en-CA")} visitor{selectedPoint.value === 1 ? "" : "s"}
        </p>
      )}
    </div>
  );
}

function niceCeil(value: number) {
  if (value <= 2) return value;

  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const niceNormalized = normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;

  return niceNormalized * magnitude;
}

function getAxisTicks(series: SeriesPoint[], range: (typeof RANGE_OPTIONS)[number]["key"]) {
  if (series.length === 0) return [];

  const indexes =
    range === "daily"
      ? series.map((_, index) => index)
      : range === "monthly"
        ? [0, 3, 6, 9, series.length - 1]
        : [0, 6, 12, 18, series.length - 1];

  return Array.from(new Set(indexes))
    .filter((index) => index >= 0 && index < series.length)
    .map((index) => ({
      index,
      left: series.length === 1 ? 50 : (index / (series.length - 1)) * 100,
      label: compactAxisLabel(series[index].label, range),
    }));
}

function compactAxisLabel(label: string, range: (typeof RANGE_OPTIONS)[number]["key"]) {
  if (range === "hourly") {
    return label.replace(/\s*a\.m\./i, "a").replace(/\s*p\.m\./i, "p").replace(/\s*AM/i, "a").replace(/\s*PM/i, "p");
  }
  if (range === "daily") {
    return label.split(",")[0].split(" ")[0];
  }
  return label.split(" ")[0];
}

function RankedList({
  icon,
  title,
  empty,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  empty: string;
  items: CountItem[];
}) {
  const max = useMemo(() => Math.max(...items.map((item) => item.count), 1), [items]);

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <h2 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
        {icon}
        {title}
      </h2>
      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">{empty}</p>
        ) : (
          items.map((item, index) => (
            <div key={`${item.label}-${index}`}>
              <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                <span className="truncate text-gray-700 dark:text-gray-300">{item.label}</span>
                <span className="font-semibold text-gray-900 dark:text-white">{item.count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.max((item.count / max) * 100, 4)}%` }} />
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
