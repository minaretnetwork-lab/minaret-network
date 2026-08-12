import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getCurrentDbUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  return prisma.user.findUnique({ where: { supabaseId: user.id } });
}

export async function GET() {
  const dbUser = await getCurrentDbUser();
  if (!dbUser) return Response.json({ error: "Not authenticated" }, { status: 401 });

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

  const [count, latestUnreadMessage, pendingApplications, pendingEditDrafts] = await Promise.all([
    prisma.message.count({ where: unreadWhere }),
    prisma.message.findFirst({
      where: unreadWhere,
      orderBy: { createdAt: "desc" },
      select: { conversationId: true },
    }),
    dbUser.role === "ADMIN" || dbUser.role === "SUPER_ADMIN"
      ? prisma.professional.count({ where: { status: "PENDING" } })
      : Promise.resolve(0),
    dbUser.role === "ADMIN" || dbUser.role === "SUPER_ADMIN"
      ? prisma.professionalEditDraft.count({ where: { status: "PENDING" } })
      : Promise.resolve(0),
  ]);
  const adminCount = pendingApplications + pendingEditDrafts;

  return Response.json({
    count,
    totalCount: count + adminCount,
    messagesCount: count,
    adminCount,
    latestConversationId: latestUnreadMessage?.conversationId ?? null,
  });
}
