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

function isConversationArchivedForUser(
  conversation: {
    requesterId: string;
    requesterArchivedAt: Date | null;
    professional: { userId: string };
    professionalArchivedAt: Date | null;
  },
  userId: string
) {
  if (conversation.requesterId === userId) return Boolean(conversation.requesterArchivedAt);
  if (conversation.professional.userId === userId) return Boolean(conversation.professionalArchivedAt);
  return false;
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

export async function getConversationForMatchingServiceRequest(serviceRequestId: string) {
  const dbUser = await getCurrentDbUser();
  if (!dbUser) return null;

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

  if (!request || request.userId === dbUser.id || !request.serviceAreaId) {
    return null;
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

  if (!professional) return null;

  const existingConversation = await prisma.conversation.findUnique({
    where: {
      serviceRequestId_professionalId: {
        serviceRequestId: request.id,
        professionalId: professional.id,
      },
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { id: true, displayName: true, firstName: true, lastName: true, email: true } } },
      },
    },
  });

  if (request.status !== "OPEN" && !existingConversation) return null;

  const conversation = existingConversation ?? await prisma.conversation.create({
    data: {
      serviceRequestId: request.id,
      professionalId: professional.id,
      requesterId: request.userId,
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { id: true, displayName: true, firstName: true, lastName: true, email: true } } },
      },
    },
  });

  await prisma.message.updateMany({
    where: {
      conversationId: conversation.id,
      senderId: { not: dbUser.id },
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  return { currentUserId: dbUser.id, conversation };
}

export async function getMyConversations(view: "active" | "archived" = "active") {
  const dbUser = await getCurrentDbUser();
  if (!dbUser) return { currentUserId: null, conversations: [], counts: { active: 0, archived: 0 } };

  const allConversations = await prisma.conversation.findMany({
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

  const activeConversations = allConversations.filter((conversation) => !isConversationArchivedForUser(conversation, dbUser.id));
  const archivedConversations = allConversations.filter((conversation) => isConversationArchivedForUser(conversation, dbUser.id));

  return {
    currentUserId: dbUser.id,
    conversations: view === "archived" ? archivedConversations : activeConversations,
    counts: {
      active: activeConversations.length,
      archived: archivedConversations.length,
    },
  };
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

  await prisma.message.updateMany({
    where: {
      conversationId: conversation.id,
      senderId: { not: dbUser.id },
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  return {
    currentUserId: dbUser.id,
    conversation,
    viewerHasArchived: isConversationArchivedForUser(conversation, dbUser.id),
  };
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

export async function getExistingConversationWithProfessional(professionalId: string) {
  const dbUser = await getCurrentDbUser();
  if (!dbUser) return null;

  return prisma.conversation.findFirst({
    where: {
      requesterId: dbUser.id,
      professionalId,
    },
    select: { id: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function setConversationArchivedState(conversationId: string, archived: boolean) {
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
    include: {
      professional: {
        select: { userId: true },
      },
      serviceRequest: {
        select: { status: true },
      },
    },
  });

  if (!conversation) throw new Error("Conversation not found.");

  const requestClosed = conversation.serviceRequest.status === "CLOSED" || conversation.serviceRequest.status === "CANCELLED";
  if (!requestClosed) {
    throw new Error("Only closed conversations can be archived.");
  }

  const archivedAt = archived ? new Date() : null;
  await prisma.conversation.update({
    where: { id: conversationId },
    data:
      conversation.requesterId === dbUser.id
        ? {
            requesterArchivedAt: archivedAt,
            professionalArchivedAt: conversation.professionalArchivedAt,
          }
        : {
            requesterArchivedAt: conversation.requesterArchivedAt,
            professionalArchivedAt: archivedAt,
          },
  });

  revalidatePath("/dashboard/messages");
  revalidatePath(`/dashboard/messages/${conversationId}`);
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
