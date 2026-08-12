export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth";
import {
  ProfessionalRegistrationForm,
  type ProfessionalFormInitialData,
} from "@/components/professionals/registration-form";
import { prisma } from "@/lib/prisma";
import { DEFAULT_MOSQUE_SLUG } from "@/lib/constants";
import { Lock } from "lucide-react";

export const metadata = { title: "Edit Professional Listing" };

export default async function EditProfessionalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  const { id } = await params;
  if (!user) redirect(`/auth/login?redirectTo=/professionals/${id}/edit`);

  const [professional, mosqueList, defaultMosque] = await Promise.all([
    prisma.professional.findFirst({
      where: { id, userId: user.id },
      select: {
        id: true,
        mosqueId: true,
        categoryId: true,
        businessName: true,
        title: true,
        bio: true,
        yearsOfExperience: true,
        qualifications: true,
        licenses: true,
        languages: true,
        phone: true,
        email: true,
        website: true,
        whatsapp: true,
        businessAddress: true,
        acceptsWalkIns: true,
        availability: true,
        photoUrl: true,
        logoUrl: true,
        isFeatured: true,
        featuredListings: {
          where: { status: "ACTIVE" },
          select: { id: true },
          take: 1,
        },
        serviceAreas: { select: { id: true } },
      },
    }),
    prisma.mosque.findMany({
      where: { isActive: true },
      select: { id: true, name: true, city: true },
      orderBy: { name: "asc" },
    }),
    prisma.mosque.findUnique({
      where: { slug: DEFAULT_MOSQUE_SLUG },
      select: {
        categories: {
          where: { isActive: true },
          select: { id: true, name: true, slug: true, icon: true },
          orderBy: { name: "asc" },
        },
        serviceAreas: {
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        },
      },
    }),
  ]);

  if (!professional) notFound();
  const isFeaturedLocked = professional.isFeatured || professional.featuredListings.length > 0;

  if (isFeaturedLocked) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <Lock className="h-7 w-7" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900" style={{ fontFamily: "var(--font-lora)" }}>
            Featured listing locked
          </h1>
          <p className="mx-auto max-w-md text-sm leading-6 text-amber-900">
            This profile is currently featured on Minaret Network, so edits are paused to keep its public listing stable.
            Please contact admin if you need a change made while it is featured.
          </p>
          <a
            href="/dashboard/professional"
            className="mt-6 inline-flex rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100"
          >
            Back to my listings
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Edit Professional Listing
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
          Update this listing&apos;s details. Changes return to admin review before the listing goes live again.
        </p>
      </div>
      <ProfessionalRegistrationForm
        mosques={mosqueList}
        categories={defaultMosque?.categories ?? []}
        serviceAreas={defaultMosque?.serviceAreas ?? []}
        initialData={professional as ProfessionalFormInitialData}
        mode="edit"
      />
    </div>
  );
}
