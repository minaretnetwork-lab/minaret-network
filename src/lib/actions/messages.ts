"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

async function getCurrentDbUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  return prisma.user.findUnique({ where: { supabaseId: user.id } });
}

function cleanMessageBody(body: FormDataEntryValue | null) {
  return typeof body === "string" ? body.trim().replace(/\n{4,}/g, "\n\n\n") : "";
}

export async function startConversationForServiceRequest(serviceRequestId: string) {
  const dbUser = await getCurrentDbUser();
  if (!dbUser) redirect(`/auth/login?redirectTo=/dashboard/leads/${serviceRequestId}`);

  const request = await prisma.serviceRequest.findUnique({
    where: { id: serviceRequestId },
    select: {
      id: true,
      userId: true,
      categoryId: true,
      serviceAreaId: true,
      status: true,
    },
  });

  if (!request || request.status !== "OPEN" || request.userId === dbUser.id || !request.serviceAreaId) {
    throw new Error("This request is not available for messaging.");
  }

  const professional = await prisma.professional.findFirst({
    where: {
      userId: dbUser.id,
      status: "APPROVED",
      categoryId: request.categoryId,
      serviceAreas: { some: { id: request.serviceAreaId } },
    },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  if (!professional) {
    throw new Error("You do not have an approved matching listing for this request.");
  }

  const conversation = await prisma.conversation.upsert({
    where: {
      serviceRequestId_professionalId: {
        serviceRequestId: request.id,
        professionalId: professional.id,
      },
    },
    create: {
      serviceRequestId: request.id,
      professionalId: professional.id,
      requesterId: request.userId,
    },
    update: {},
    select: { id: true },
  });

  revalidatePath("/dashboard/messages");
  revalidatePath(`/dashboard/leads/${serviceRequestId}`);
  redirect(`/dashboard/messages/${conversation.id}`);
}

export async function getMyConversations() {
  const dbUser = await getCurrentDbUser();
  if (!dbUser) return { currentUserId: null, conversations: [] };

  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [
        { requesterId: dbUser.id },
        { professional: { userId: dbUser.id } },
      ],
    },
    include: {
      requester: { select: { id: true, displayName: true, firstName: true, lastName: true, email: true } },
      professional: {
        include: {
          user: { select: { id: true, displayName: true, firstName: true, lastName: true, email: true } },
          category: { select: { name: true, slug: true, icon: true } },
        },
      },
      serviceRequest: {
        include: {
          category: { select: { name: true, slug: true, icon: true } },
          serviceArea: { select: { name: true } },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { sender: { select: { id: true, displayName: true, firstName: true, lastName: true } } },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return { currentUserId: dbUser.id, conversations };
}

export async function getConversationById(id: string) {
  const dbUser = await getCurrentDbUser();
  if (!dbUser) return null;

  const conversation = await prisma.conversation.findFirst({
    where: {
      id,
      OR: [
        { requesterId: dbUser.id },
        { professional: { userId: dbUser.id } },
      ],
    },
    include: {
      requester: { select: { id: true, displayName: true, firstName: true, lastName: true, email: true } },
      professional: {
        include: {
          user: { select: { id: true, displayName: true, firstName: true, lastName: true, email: true } },
          category: { select: { name: true, slug: true, icon: true } },
        },
      },
      serviceRequest: {
        include: {
          category: { select: { name: true, slug: true, icon: true } },
          serviceArea: { select: { name: true } },
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { id: true, displayName: true, firstName: true, lastName: true } } },
      },
    },
  });

  if (!conversation) return null;
  return { currentUserId: dbUser.id, conversation };
}

export async function getConversationsForMyRequest(serviceRequestId: string) {
  const dbUser = await getCurrentDbUser();
  if (!dbUser) return [];

  return prisma.conversation.findMany({
    where: {
      serviceRequestId,
      requesterId: dbUser.id,
    },
    include: {
      professional: {
        include: {
          user: { select: { displayName: true, firstName: true, lastName: true, email: true } },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function sendConversationMessage(conversationId: string, formData: FormData) {
  const body = cleanMessageBody(formData.get("body"));
  if (body.length < 1) return;
  if (body.length > 2000) throw new Error("Messages must be 2,000 characters or less.");

  const dbUser = await getCurrentDbUser();
  if (!dbUser) redirect(`/auth/login?redirectTo=/dashboard/messages/${conversationId}`);

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [
        { requesterId: dbUser.id },
        { professional: { userId: dbUser.id } },
      ],
    },
    select: { id: true },
  });

  if (!conversation) throw new Error("Conversation not found.");

  await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId,
        senderId: dbUser.id,
        body,
      },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    }),
  ]);

  revalidatePath("/dashboard/messages");
  revalidatePath(`/dashboard/messages/${conversationId}`);
}
