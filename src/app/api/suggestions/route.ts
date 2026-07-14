import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_MOSQUE_SLUG } from "@/lib/constants";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();

  if (q.length < 2) return NextResponse.json([]);

  const mosque = await prisma.mosque.findUnique({
    where: { slug: DEFAULT_MOSQUE_SLUG },
    select: { id: true },
  });
  if (!mosque) return NextResponse.json([]);

  const [categories, professionals] = await Promise.all([
    prisma.category.findMany({
      where: {
        mosqueId: mosque.id,
        isActive: true,
        name: { contains: q, mode: "insensitive" },
      },
      select: { name: true, slug: true, icon: true },
      take: 5,
      orderBy: { name: "asc" },
    }),
    prisma.professional.findMany({
      where: {
        mosqueId: mosque.id,
        status: "APPROVED",
        OR: [
          { businessName: { contains: q, mode: "insensitive" } },
          { title: { contains: q, mode: "insensitive" } },
          { user: { displayName: { contains: q, mode: "insensitive" } } },
          { user: { firstName: { contains: q, mode: "insensitive" } } },
        ],
      },
      select: {
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
      label: `${c.icon ? c.icon + " " : ""}${c.name}`,
      type: "category" as const,
      slug: c.slug,
    })),
    ...professionals.map((p) => ({
      label: p.businessName ?? p.user.displayName ?? `${p.user.firstName ?? ""} ${p.user.lastName ?? ""}`.trim(),
      type: "professional" as const,
    })),
  ];

  // Deduplicate by label
  const seen = new Set<string>();
  const unique = suggestions.filter((s) => {
    if (seen.has(s.label)) return false;
    seen.add(s.label);
    return true;
  });

  return NextResponse.json(unique);
}
