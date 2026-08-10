import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getCurrentDbUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  return prisma.user.findUnique({ where: { supabaseId: user.id } });
}

async function getAuthorizedConversation(conversationId: string, userId: string) {
  return prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [
        { requesterId: userId },
        { professional: { userId } },
      ],
    },
    select: { id: true },
  });
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const dbUser = await getCurrentDbUser();
  if (!dbUser) return Response.json({ error: "Not authenticated" }, { status: 401 });

  const conversation = await getAuthorizedConversation(id, dbUser.id);
  if (!conversation) return Response.json({ error: "Conversation not found" }, { status: 404 });

  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
    include: {
      sender: { select: { id: true, displayName: true, firstName: true, lastName: true, email: true } },
    },
  });

  return Response.json({
    currentUserId: dbUser.id,
    messages: messages.map((message) => ({
      id: message.id,
      senderId: message.senderId,
      senderName:
        message.sender.displayName ||
        [message.sender.firstName, message.sender.lastName].filter(Boolean).join(" ") ||
        message.sender.email,
      body: message.body,
      createdAt: message.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const dbUser = await getCurrentDbUser();
  if (!dbUser) return Response.json({ error: "Not authenticated" }, { status: 401 });

  const conversation = await getAuthorizedConversation(id, dbUser.id);
  if (!conversation) return Response.json({ error: "Conversation not found" }, { status: 404 });

  const payload = await request.json().catch(() => null) as { body?: unknown } | null;
  const body = typeof payload?.body === "string" ? payload.body.trim().replace(/\n{4,}/g, "\n\n\n") : "";

  if (!body) return Response.json({ error: "Message cannot be empty" }, { status: 400 });
  if (body.length > 2000) return Response.json({ error: "Messages must be 2,000 characters or less" }, { status: 400 });

  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.message.create({
      data: {
        conversationId: id,
        senderId: dbUser.id,
        body,
      },
      include: {
        sender: { select: { id: true, displayName: true, firstName: true, lastName: true, email: true } },
      },
    });

    await tx.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    return created;
  });

  return Response.json({
    message: {
      id: message.id,
      senderId: message.senderId,
      senderName:
        message.sender.displayName ||
        [message.sender.firstName, message.sender.lastName].filter(Boolean).join(" ") ||
        message.sender.email,
      body: message.body,
      createdAt: message.createdAt.toISOString(),
    },
  }, { status: 201 });
}
