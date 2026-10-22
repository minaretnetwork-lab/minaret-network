import type { Prisma } from "@prisma/client";

type ProfileEditor = { role: string; isActive: boolean } | null | undefined;

export function isProfileAdmin(user: ProfileEditor): boolean {
  return !!user?.isActive && (user.role === "ADMIN" || user.role === "SUPER_ADMIN");
}

export function profilePhotoEditWhere(professionalId: string, user: { id: string; role: string; isActive: boolean }): Prisma.ProfessionalWhereInput {
  if (!user.isActive) return { id: professionalId, userId: { in: [] } };
  return isProfileAdmin(user) ? { id: professionalId } : {
    id: professionalId,
    AND: [
      { OR: [{ userId: user.id }, { claimedByUserId: user.id }] },
      { OR: [{ isAdminCreated: false }, { claimedByUserId: { not: null } }] },
    ],
  };
}
