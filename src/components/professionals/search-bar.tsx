"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SearchBar({ defaultValue = "" }: { defaultValue?: string }) {
  const [query, setQuery] = useState(defaultValue);
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (query.trim()) {
      params.set("q", query.trim());
    } else {
      params.delete("q");
    }
    params.delete("page");
    router.push(`/professionals?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSearch} className="flex gap-2 w-full max-w-xl">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by profession, name, or keyword…"
          className="pl-9 h-11 border-gray-300 focus-visible:ring-green-500"
        />
      </div>
      <Button type="submit" className="h-11 bg-green-600 hover:bg-green-700 text-white px-6">
        Search
      </Button>
    </form>
  );
}
