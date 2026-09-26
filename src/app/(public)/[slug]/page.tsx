import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { CATEGORY_BY_URL_SLUG, CATEGORY_CONFIG } from "@/lib/seo/category-config";
import { AREA_BY_URL_SLUG, AREA_CONFIG, AREA_BY_DB_SLUG } from "@/lib/seo/area-config";
import { CATEGORY_BY_DB_SLUG } from "@/lib/seo/category-config";
import { getProfessionalDisplayPhotoUrl } from "@/lib/public-asset-url";
import { getInitials } from "@/lib/utils";
import type { Metadata } from "next";

const MAX_SERVICE_AREAS = 20;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const params: { slug: string }[] = [];
  for (const c of CATEGORY_CONFIG) params.push({ slug: c.urlSlug });
  for (const a of AREA_CONFIG) params.push({ slug: a.urlSlug });
  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = CATEGORY_BY_URL_SLUG.get(slug);
  if (category) {
    return {
      title: `${category.seoPluralLong} — Minaret Network`,
      description: category.description,
      alternates: { canonical: `/${slug}` },
    };
  }
  const area = AREA_BY_URL_SLUG.get(slug);
  if (area) {
    return {
      title: `Muslim Professionals in ${area.displayName} — Minaret Network`,
      description: `Browse trusted Muslim professionals serving ${area.displayName}, ${area.province} on the Minaret Network Muslim professional directory.`,
      alternates: { canonical: `/${slug}` },
    };
  }
  return { title: "Not Found" };
}

async function CategoryHubPage({ slug }: { slug: string }) {
  const category = CATEGORY_BY_URL_SLUG.get(slug)!;

  const professionals = await prisma.professional.findMany({
    where: {
      status: "APPROVED",
      category: { slug: category.dbSlug },
      serviceAreas: { some: {} },
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

  const areaCountMap = new Map<string, number>();
  for (const pro of qualified) {
    for (const area of pro.serviceAreas) {
      areaCountMap.set(area.slug, (areaCountMap.get(area.slug) ?? 0) + 1);
    }
  }
  const areasWithPros = [...areaCountMap.entries()]
    .map(([dbSlug, count]) => ({ dbSlug, count, config: AREA_BY_DB_SLUG.get(dbSlug) }))
    .filter((a) => a.config)
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-green-700">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-800 dark:text-gray-200">{category.plural}</span>
      </nav>

      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{category.seoPluralLong}</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">{category.description}</p>

      {areasWithPros.length > 0 && (
        <section className="mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">Browse by area</h2>
          <div className="flex flex-wrap gap-2">
            {areasWithPros.map(({ dbSlug, count, config }) => (
              <Link
                key={dbSlug}
                href={`/${slug}/${config!.urlSlug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-700 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:border-green-500 hover:text-green-700 transition-colors"
              >
                <MapPin className="h-3.5 w-3.5 text-gray-400" />
                {config!.displayName}
                <span className="text-gray-400 text-xs">({count})</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="space-y-4">
        {qualified.length === 0 && (
          <p className="text-gray-500 py-8 text-center">No {category.plural.toLowerCase()} listed yet.</p>
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

async function AreaHubPage({ slug }: { slug: string }) {
  const area = AREA_BY_URL_SLUG.get(slug)!;

  const professionals = await prisma.professional.findMany({
    where: {
      status: "APPROVED",
      serviceAreas: { some: { slug: area.dbSlug } },
    },
    select: {
      id: true,
      category: { select: { slug: true, name: true } },
      serviceAreas: { select: { slug: true } },
    },
  });

  const qualified = professionals.filter((p) => p.serviceAreas.length <= MAX_SERVICE_AREAS);

  const catCountMap = new Map<string, number>();
  for (const pro of qualified) {
    const s = pro.category.slug;
    catCountMap.set(s, (catCountMap.get(s) ?? 0) + 1);
  }

  const categories = [...catCountMap.entries()]
    .map(([catDbSlug, count]) => ({ catDbSlug, count, config: CATEGORY_BY_DB_SLUG.get(catDbSlug) }))
    .filter((c) => c.config)
    .sort((a, b) => b.count - a.count);

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-green-700">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-800 dark:text-gray-200">{area.displayName}</span>
      </nav>

      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        Muslim Professionals in {area.displayName}
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Browse trusted Muslim professionals serving {area.displayName}, {area.province}.
      </p>

      {categories.length === 0 ? (
        <p className="text-gray-500 py-8 text-center">No professionals listed in {area.displayName} yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {categories.map(({ catDbSlug, count, config }) => (
            <Link
              key={catDbSlug}
              href={`/${config!.urlSlug}/${slug}`}
              className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 hover:border-green-400 transition-colors text-center shadow-sm"
            >
              <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">{config!.plural}</p>
              <p className="text-xs text-gray-400 mt-0.5">{count} listed</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default async function SlugDispatchPage({ params }: Props) {
  const { slug } = await params;

  if (CATEGORY_BY_URL_SLUG.has(slug)) {
    return <CategoryHubPage slug={slug} />;
  }
  if (AREA_BY_URL_SLUG.has(slug)) {
    return <AreaHubPage slug={slug} />;
  }
  notFound();
}
