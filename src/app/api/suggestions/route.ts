import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const type = searchParams.get("type"); // "location" | null (default = keyword)

  if (q.length < 2) return NextResponse.json([]);

  // Location suggestions — service area names
  if (type === "location") {
    const areas = await prisma.serviceArea.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      select: { name: true, slug: true },
      take: 8,
      orderBy: { name: "asc" },
    });
    return NextResponse.json(
      areas.map((a) => ({ label: a.name, type: "area", slug: a.slug }))
    );
  }

  // Keyword suggestions — categories + professionals
  const [categories, professionals] = await Promise.all([
    prisma.category.findMany({
      where: {
        isActive: true,
        name: { contains: q, mode: "insensitive" },
      },
      select: { name: true, slug: true, icon: true },
      take: 5,
      orderBy: { name: "asc" },
    }),
    prisma.professional.findMany({
      where: {
        status: "APPROVED",
        OR: [
          { businessName: { contains: q, mode: "insensitive" } },
          { title: { contains: q, mode: "insensitive" } },
          { user: { displayName: { contains: q, mode: "insensitive" } } },
          { user: { firstName: { contains: q, mode: "insensitive" } } },
          { category: { name: { contains: q, mode: "insensitive" } } },
          { categories: { some: { name: { contains: q, mode: "insensitive" } } } },
        ],
      },
      select: {
        id: true,
        businessName: true,
        title: true,
        user: { select: { displayName: true, firstName: true, lastName: true } },
      },
      take: 4,
    }),
  ]);

  type Suggestion = { label: string; type: "category" | "professional"; slug?: string };
  const suggestions: Suggestion[] = [
    ...categories.map((c) => ({
      label: c.name,
      type: "category" as const,
      slug: c.slug,
    })),
    ...professionals.map((p) => ({
      label: p.businessName ?? p.user.displayName ?? `${p.user.firstName ?? ""} ${p.user.lastName ?? ""}`.trim(),
      type: "professional" as const,
      slug: p.id,
    })),
  ];

  const seen = new Set<string>();
  return NextResponse.json(
    suggestions.filter((s) => {
      if (seen.has(s.label)) return false;
      seen.add(s.label);
      return true;
    })
  );
}
