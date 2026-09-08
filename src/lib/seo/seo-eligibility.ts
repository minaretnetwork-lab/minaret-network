import { prisma } from "@/lib/prisma";

const MAX_SERVICE_AREAS = 20;

export type IndexableProfessional = {
  id: string;
  profileSlug: string | null;
  businessName: string | null;
  title: string | null;
  bio: string | null;
  businessAddress: string | null;
  category: { slug: string; name: string };
  serviceAreas: { slug: string; name: string }[];
  user: { firstName: string | null; lastName: string | null } | null;
};

export async function getQualifiedProfessionals(): Promise<IndexableProfessional[]> {
  return prisma.professional.findMany({
    where: {
      status: "APPROVED",
      serviceAreas: {
        some: {},
      },
    },
    select: {
      id: true,
      profileSlug: true,
      businessName: true,
      title: true,
      bio: true,
      businessAddress: true,
      category: { select: { slug: true, name: true } },
      serviceAreas: { select: { slug: true, name: true } },
      user: { select: { firstName: true, lastName: true } },
    },
  }).then((pros) =>
    pros.filter((p) => p.serviceAreas.length <= MAX_SERVICE_AREAS)
  );
}

export function isPageIndexable(professional: { bio: string | null; serviceAreas: { slug: string }[] }): boolean {
  const hasBio = !!(professional.bio && professional.bio.trim().length > 20);
  const hasReasonableAreas = professional.serviceAreas.length >= 1 && professional.serviceAreas.length <= MAX_SERVICE_AREAS;
  return hasBio && hasReasonableAreas;
}
