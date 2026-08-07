export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth";
import {
  ProfessionalRegistrationForm,
  type ProfessionalFormInitialData,
} from "@/components/professionals/registration-form";
import { prisma } from "@/lib/prisma";
import { DEFAULT_MOSQUE_SLUG } from "@/lib/constants";

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
        availability: true,
        photoUrl: true,
        logoUrl: true,
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
