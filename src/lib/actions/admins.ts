"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "./auth";
import { revalidatePath } from "next/cache";

async function requireSuperAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");
  return user;
}

export async function getAdmins() {
  await requireSuperAdmin();
  return prisma.user.findMany({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      displayName: true,
      role: true,
      createdAt: true,
      isActive: true,
    },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });
}

export async function getUsersForAdminManagement() {
  await requireSuperAdmin();
  return prisma.user.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      displayName: true,
      role: true,
      isActive: true,
      createdAt: true,
      professionals: {
        where: { status: "APPROVED" },
        select: {
          id: true,
          businessName: true,
        },
      },
    },
    orderBy: [
      { role: "asc" },
      { createdAt: "asc" },
    ],
  });
}

export async function searchUsers(query: string) {
  await requireSuperAdmin();
  if (!query || query.trim().length < 2) return [];
  return prisma.user.findMany({
    where: {
      role: { notIn: ["ADMIN", "SUPER_ADMIN"] },
      OR: [
        { email: { contains: query, mode: "insensitive" } },
        { firstName: { contains: query, mode: "insensitive" } },
        { lastName: { contains: query, mode: "insensitive" } },
        { displayName: { contains: query, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      displayName: true,
      role: true,
    },
    take: 10,
  });
}

export async function promoteToAdmin(userId: string) {
  const me = await requireSuperAdmin();
  if (userId === me.id) throw new Error("Cannot change your own role");
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) throw new Error("User not found");
  if (target.role === "SUPER_ADMIN") throw new Error("Cannot modify a super admin");
  await prisma.user.update({ where: { id: userId }, data: { role: "ADMIN" } });
  revalidatePath("/admin/admins");
}

export async function promoteToSuperAdmin(userId: string) {
  const me = await requireSuperAdmin();
  if (userId === me.id) throw new Error("You are already a super admin");
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) throw new Error("User not found");
  await prisma.user.update({ where: { id: userId }, data: { role: "SUPER_ADMIN" } });
  revalidatePath("/admin/admins");
}

export async function demoteAdmin(userId: string) {
  const me = await requireSuperAdmin();
  if (userId === me.id) throw new Error("Cannot change your own role");
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) throw new Error("User not found");
  if (target.role === "SUPER_ADMIN") throw new Error("Cannot modify a super admin");
  await prisma.user.update({ where: { id: userId }, data: { role: "MEMBER" } });
  revalidatePath("/admin/admins");
}

export async function toggleAdminActive(userId: string, isActive: boolean) {
  const me = await requireSuperAdmin();
  if (userId === me.id) throw new Error("Cannot change your own status");
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) throw new Error("User not found");
  if (target.role === "SUPER_ADMIN") throw new Error("Cannot modify a super admin");
  await prisma.user.update({ where: { id: userId }, data: { isActive } });
  revalidatePath("/admin/admins");
}
