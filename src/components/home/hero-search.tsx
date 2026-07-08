"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ServiceArea {
  slug: string;
  name: string;
}

interface HeroSearchProps {
  serviceAreas: ServiceArea[];
}

export function HeroSearch({ serviceAreas }: HeroSearchProps) {
  const [query, setQuery] = useState("");
  const [area, setArea] = useState("");
  const [locating, setLocating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`
          );
          const data = await res.json();
          const city: string =
            data.address?.city ||
            data.address?.town ||
            data.address?.suburb ||
            "";
          const matched = serviceAreas.find(
            (a) =>
              city.toLowerCase().includes(a.name.toLowerCase()) ||
              a.name.toLowerCase().includes(city.toLowerCase())
          );
          if (matched) setArea(matched.slug);
        } catch {
          // silent fail — stays on "Anywhere in GTA"
        } finally {
          setLocating(false);
        }
      },
      () => setLocating(false),
      { timeout: 6000 }
    );
  }, [serviceAreas]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (area) params.set("area", area);
    router.push(`/professionals${params.size ? `?${params}` : ""}`);
  }

  return (
    <form
      onSubmit={handleSearch}
      className="flex flex-col sm:flex-row gap-3 w-full max-w-2xl"
    >
      {/* Service / keyword search */}
      <div className="relative flex-1">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40 pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by service, category, or mosque"
          className="pl-11 h-12 text-base border-white/30 bg-white/10 text-white placeholder:text-white/40 focus-visible:ring-white focus-visible:border-white backdrop-blur"
        />
      </div>

      {/* Location picker */}
      <div className="relative sm:w-52">
        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40 pointer-events-none z-10" />
        <select
          value={area}
          onChange={(e) => setArea(e.target.value)}
          className="w-full h-12 pl-11 pr-4 rounded-lg text-base border border-white/30 bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-white backdrop-blur appearance-none cursor-pointer"
        >
          <option value="" className="bg-[#071a0e] text-white">
            {locating ? "Detecting…" : "Anywhere in GTA"}
          </option>
          {serviceAreas.map((a) => (
            <option key={a.slug} value={a.slug} className="bg-[#071a0e] text-white">
              {a.name}
            </option>
          ))}
        </select>
      </div>

      <Button
        type="submit"
        size="lg"
        className="h-12 bg-white text-emerald-900 hover:bg-emerald-50 font-semibold px-8 flex-shrink-0"
      >
        Find
      </Button>
    </form>
  );
}
