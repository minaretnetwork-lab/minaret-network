"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signIn(email: string, password: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  redirect("/dashboard");
}

export async function signUp(email: string, password: string, firstName: string, lastName: string) {
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

  await prisma.user.create({
    data: {
      supabaseId: data.user.id,
      email,
      firstName,
      lastName,
      displayName: `${firstName} ${lastName}`,
      mosqueId: mosque?.id,
      role: "MEMBER",
    },
  });

  redirect("/auth/verify-email");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function updateUserProfile(data: {
  firstName: string;
  lastName: string;
  phone?: string;
  whatsapp?: string;
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

  const [unreadMessageCount, latestUnreadMessage] = await Promise.all([
    prisma.message.count({ where: unreadWhere }),
    prisma.message.findFirst({
      where: unreadWhere,
      orderBy: { createdAt: "desc" },
      select: { conversationId: true },
    }),
  ]);

  return {
    ...dbUser,
    unreadMessageCount,
    latestUnreadConversationId: latestUnreadMessage?.conversationId ?? null,
  };
}
