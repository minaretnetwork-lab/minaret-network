import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { CATEGORY_BY_URL_SLUG, CATEGORY_CONFIG } from "@/lib/seo/category-config";
import { AREA_BY_URL_SLUG, AREA_CONFIG } from "@/lib/seo/area-config";
import { getProfessionalDisplayPhotoUrl } from "@/lib/public-asset-url";
import { getInitials } from "@/lib/utils";
import type { Metadata } from "next";

const MAX_SERVICE_AREAS = 20;

interface Props {
  params: Promise<{ slug: string; subSlug: string }>;
}

export async function generateStaticParams() {
  const params: { slug: string; subSlug: string }[] = [];
  for (const c of CATEGORY_CONFIG) {
    for (const a of AREA_CONFIG) {
      params.push({ slug: c.urlSlug, subSlug: a.urlSlug });
    }
  }
  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, subSlug } = await params;
  const category = CATEGORY_BY_URL_SLUG.get(slug);
  const area = AREA_BY_URL_SLUG.get(subSlug);
  if (!category || !area) return { title: "Not Found" };
  const title = `${category.seoPluralLong} in ${area.displayName} — Minaret Network`;
  const description = `Find trusted ${category.plural.toLowerCase()} serving ${area.displayName}, ${area.province} on the Minaret Network Muslim professional directory.`;
  return {
    title,
    description,
    alternates: { canonical: `/${slug}/${subSlug}` },
  };
}

export default async function CategoryAreaPage({ params }: Props) {
  const { slug, subSlug } = await params;
  const category = CATEGORY_BY_URL_SLUG.get(slug);
  const area = AREA_BY_URL_SLUG.get(subSlug);
  if (!category || !area) notFound();

  const professionals = await prisma.professional.findMany({
    where: {
      status: "APPROVED",
      category: { slug: category.dbSlug },
      serviceAreas: { some: { slug: area.dbSlug } },
    },
    select: {
      id: true,
      profileSlug: true,
      businessName: true,
      bio: true,
      photoUrl: true,
      serviceAreas: { select: { slug: true, name: true } },
      user: { select: { firstName: true, lastName: true, avatarUrl: true } },
      recommendations: { where: { status: "APPROVED" }, select: { id: true } },
    },
    orderBy: [{ isFeatured: "desc" }, { approvedAt: "desc" }],
  });

  const qualified = professionals.filter((p) => p.serviceAreas.length <= MAX_SERVICE_AREAS);

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-green-700">Home</Link>
        <span className="mx-2">/</span>
        <Link href={`/${slug}`} className="hover:text-green-700">{category.plural}</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-800 dark:text-gray-200">{area.displayName}</span>
      </nav>

      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        {category.seoPluralLong} in {area.displayName}
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Find trusted {category.plural.toLowerCase()} serving {area.displayName}, {area.province} on the Minaret Network Muslim professional directory.
      </p>

      <div className="space-y-4">
        {qualified.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-gray-500 mb-4">No {category.plural.toLowerCase()} listed in {area.displayName} yet.</p>
            <Link href={`/${slug}`} className="text-green-700 hover:underline text-sm">
              Browse all {category.plural.toLowerCase()} →
            </Link>
          </div>
        )}
        {qualified.map((pro) => {
          const name = pro.businessName ?? ([pro.user?.firstName, pro.user?.lastName].filter(Boolean).join(" ") || "Professional");
          const photoUrl = getProfessionalDisplayPhotoUrl({ photoUrl: pro.photoUrl, avatarUrl: pro.user?.avatarUrl ?? null });
          const areas = pro.serviceAreas.map((a) => a.name).slice(0, 4).join(", ");
          const href = pro.profileSlug ? `/professional/${pro.profileSlug}` : `/professionals/${pro.id}`;
          return (
            <Link key={pro.id} href={href} className="flex items-start gap-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 hover:border-green-400 transition-colors shadow-sm">
              {photoUrl ? (
                <Image unoptimized src={photoUrl} alt={name} width={56} height={56} className="h-14 w-14 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="h-14 w-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-lg font-bold text-green-700 flex-shrink-0">
                  {getInitials(name)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{name}</h3>
                  {pro.recommendations.length > 0 && (
                    <span className="text-xs text-amber-600">{pro.recommendations.length} recommendation{pro.recommendations.length !== 1 ? "s" : ""}</span>
                  )}
                </div>
                {pro.bio && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">{pro.bio}</p>
                )}
                {areas && (
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {areas}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
