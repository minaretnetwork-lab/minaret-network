"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

export async function signIn(email: string, password: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  redirect("/dashboard");
}

export async function signUp(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  redirectTo = "/dashboard",
  consent?: { ageAttested: boolean; tosAccepted: boolean },
) {
  if (!consent?.ageAttested) throw new Error("You must confirm you are 18 years or older to create an account.");
  if (!consent?.tosAccepted) throw new Error("You must accept the Terms of Service and Privacy Policy to create an account.");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { first_name: firstName, last_name: lastName },
    },
  });

  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("Signup failed");

  const mosqueSlug = process.env.NEXT_PUBLIC_DEFAULT_MOSQUE_SLUG ?? "al-falah";
  const mosque = await prisma.mosque.findUnique({ where: { slug: mosqueSlug } });
  const now = new Date();

  await prisma.user.upsert({
    where: { supabaseId: data.user.id },
    update: {
      email,
      firstName,
      lastName,
      displayName: `${firstName} ${lastName}`,
      mosqueId: mosque?.id,
      ageAttestedAt: now,
      ageAttestationVersion: "1.0",
      tosAcceptedAt: now,
      tosVersion: "1.0",
    },
    create: {
      supabaseId: data.user.id,
      email,
      firstName,
      lastName,
      displayName: `${firstName} ${lastName}`,
      mosqueId: mosque?.id,
      role: "MEMBER",
      emailVerified: false,
      ageAttestedAt: now,
      ageAttestationVersion: "1.0",
      tosAcceptedAt: now,
      tosVersion: "1.0",
    },
  });

  const safeRedirectTo = redirectTo.startsWith("/") ? redirectTo : "/dashboard";
  redirect(safeRedirectTo);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function deleteCurrentUserAccount(confirmText: string) {
  if (confirmText !== "DELETE") throw new Error("Type DELETE to confirm account deletion.");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { id: true, role: true },
  });
  if (!dbUser) throw new Error("User not found");
  if (dbUser.role === "SUPER_ADMIN") {
    throw new Error("Super admin accounts cannot be deleted from this screen.");
  }

  await prisma.$transaction(async (tx) => {
    const professionals = await tx.professional.findMany({
      where: { userId: dbUser.id },
      select: { id: true },
    });
    const professionalIds = professionals.map((professional) => professional.id);

    const serviceRequests = await tx.serviceRequest.findMany({
      where: { userId: dbUser.id },
      select: { id: true },
    });
    const serviceRequestIds = serviceRequests.map((request) => request.id);

    const conversations = await tx.conversation.findMany({
      where: {
        OR: [
          { requesterId: dbUser.id },
          ...(professionalIds.length ? [{ professionalId: { in: professionalIds } }] : []),
          ...(serviceRequestIds.length ? [{ serviceRequestId: { in: serviceRequestIds } }] : []),
        ],
      },
      select: { id: true },
    });
    const conversationIds = conversations.map((conversation) => conversation.id);

    if (conversationIds.length) {
      await tx.message.deleteMany({ where: { conversationId: { in: conversationIds } } });
      await tx.conversation.deleteMany({ where: { id: { in: conversationIds } } });
    }

    await tx.message.deleteMany({ where: { senderId: dbUser.id } });
    await tx.recommendation.deleteMany({ where: { userId: dbUser.id } });
    await tx.categorySuggestion.deleteMany({ where: { requestedById: dbUser.id } });
    await tx.mosqueSuggestion.deleteMany({ where: { requestedById: dbUser.id } });

    if (serviceRequestIds.length) {
      await tx.serviceRequest.deleteMany({ where: { id: { in: serviceRequestIds } } });
    }
    if (professionalIds.length) {
      await tx.serviceRequest.updateMany({
        where: { assignedToId: { in: professionalIds } },
        data: { assignedToId: null },
      });
      await tx.professional.deleteMany({ where: { id: { in: professionalIds } } });
    }

    await tx.user.delete({ where: { id: dbUser.id } });
  });

  const supabaseUrl = process.env.SUPABASE_INTERNAL_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  await supabase.auth.signOut();

  if (supabaseUrl && serviceRoleKey) {
    const admin = createSupabaseAdminClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    await admin.auth.admin.deleteUser(user.id);
  }
}

export async function reAcceptTos() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { CURRENT_TOS_VERSION } = await import("@/lib/constants");
  const now = new Date();
  await prisma.user.update({
    where: { supabaseId: user.id },
    data: {
      ageAttestedAt: now,
      ageAttestationVersion: CURRENT_TOS_VERSION,
      tosAcceptedAt: now,
      tosVersion: CURRENT_TOS_VERSION,
    },
  });
}

export async function updateUserProfile(data: {
  firstName: string;
  lastName: string;
  phone?: string;
  whatsapp?: string;
  preferredContact?: "EMAIL" | "PHONE" | "WHATSAPP";
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Save to DB
  await prisma.user.update({
    where: { supabaseId: user.id },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      displayName: `${data.firstName} ${data.lastName}`,
      phone: data.phone || null,
      whatsapp: data.whatsapp || null,
      preferredContact: data.preferredContact ?? null,
    },
  });

  // Keep Supabase metadata in sync
  await supabase.auth.updateUser({
    data: {
      first_name: data.firstName,
      last_name: data.lastName,
      full_name: `${data.firstName} ${data.lastName}`,
      phone: data.phone,
    },
  });
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: {
      professionals: {
        select: { id: true, status: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!dbUser) return null;

  const unreadWhere = {
    readAt: null,
    senderId: { not: dbUser.id },
    conversation: {
      OR: [
        { requesterId: dbUser.id },
        { professional: { userId: dbUser.id } },
      ],
    },
  };

  const isAdmin = dbUser.role === "ADMIN" || dbUser.role === "SUPER_ADMIN";
  const [unreadMessageCount, latestUnreadMessage, pendingApplications, pendingEditDrafts] = await Promise.all([
    prisma.message.count({ where: unreadWhere }),
    prisma.message.findFirst({
      where: unreadWhere,
      orderBy: { createdAt: "desc" },
      select: { conversationId: true },
    }),
    isAdmin ? prisma.professional.count({ where: { status: "PENDING" } }) : Promise.resolve(0),
    isAdmin ? prisma.professionalEditDraft.count({ where: { status: "PENDING" } }) : Promise.resolve(0),
  ]);

  return {
    ...dbUser,
    unreadMessageCount,
    adminNotificationCount: pendingApplications + pendingEditDrafts,
    totalNotificationCount: unreadMessageCount + pendingApplications + pendingEditDrafts,
    latestUnreadConversationId: latestUnreadMessage?.conversationId ?? null,
  };
}
