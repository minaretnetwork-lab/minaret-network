export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/actions/auth";
import {
  ProfessionalRegistrationForm,
  type ProfessionalFormInitialData,
} from "@/components/professionals/registration-form";
import { prisma } from "@/lib/prisma";
import { DEFAULT_MOSQUE_SLUG } from "@/lib/constants";

export const metadata = { title: "Edit Listing — Admin" };

export default async function AdminEditProfessionalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const allowedRoles = ["ADMIN", "SUPER_ADMIN", "LISTING_MANAGER"];
  if (!user || !allowedRoles.includes(user.role)) redirect("/dashboard");

  const [professional, mosqueList, defaultMosque] = await Promise.all([
    prisma.professional.findUnique({
      where: { id },
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
        categories: { select: { id: true } },
        serviceAreas: { select: { id: true } },
        galleryImages: { select: { id: true, url: true, caption: true }, orderBy: { sortOrder: "asc" } },
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

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link
          href={`/admin/professionals/${id}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-emerald-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to listing
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Edit: {professional.businessName ?? professional.title ?? "Unnamed"}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Changes are applied immediately without an approval step.
        </p>
      </div>

      <ProfessionalRegistrationForm
        mosques={mosqueList}
        categories={defaultMosque?.categories ?? []}
        serviceAreas={defaultMosque?.serviceAreas ?? []}
        initialData={professional as ProfessionalFormInitialData}
        mode="edit"
        endpoint="/api/admin/professionals/update"
        successRedirectHref={`/admin/professionals/${id}`}
      />
    </div>
  );
}
