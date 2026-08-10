import { NextResponse } from "next/server";
import { DEFAULT_MOSQUE_SLUG } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 2000) : "";
}

function displayName(user: { displayName: string | null; firstName: string | null; lastName: string | null; email: string }) {
  return user.displayName || [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Please sign in to message a professional.", loginUrl: "/auth/login" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser) return NextResponse.json({ error: "User not found." }, { status: 404 });

  const body = await request.json().catch(() => ({})) as { professionalId?: string; issue?: string; location?: string };
  const professionalId = cleanText(body.professionalId);
  const issue = cleanText(body.issue);
  const location = cleanText(body.location);

  if (!professionalId || issue.length < 8) {
    return NextResponse.json({ error: "Missing message details." }, { status: 400 });
  }

  const professional = await prisma.professional.findFirst({
    where: { id: professionalId, status: "APPROVED" },
    include: {
      serviceAreas: { select: { id: true, name: true } },
    },
  });

  if (!professional) return NextResponse.json({ error: "Professional not found." }, { status: 404 });
  if (professional.userId === dbUser.id) {
    return NextResponse.json({ error: "You cannot message your own listing." }, { status: 400 });
  }

  const mosque = await prisma.mosque.findUnique({ where: { slug: DEFAULT_MOSQUE_SLUG } });
  if (!mosque) return NextResponse.json({ error: "Directory is not configured." }, { status: 500 });

  const locationLower = location.toLowerCase();
  const serviceArea =
    professional.serviceAreas.find((area) => area.name.toLowerCase() === locationLower) ??
    professional.serviceAreas.find((area) => locationLower.includes(area.name.toLowerCase()) || area.name.toLowerCase().includes(locationLower)) ??
    professional.serviceAreas[0] ??
    null;

  const contactPhone = dbUser.whatsapp || dbUser.phone || null;
  const preferredContact = dbUser.preferredContact ?? (dbUser.whatsapp ? "WHATSAPP" : dbUser.phone ? "PHONE" : "EMAIL");
  const serviceRequest = await prisma.serviceRequest.create({
    data: {
      mosqueId: mosque.id,
      userId: dbUser.id,
      categoryId: professional.categoryId,
      serviceAreaId: serviceArea?.id ?? null,
      description: issue,
      preferredContact,
      contactName: displayName(dbUser),
      contactEmail: dbUser.email,
      contactPhone,
      assignedToId: professional.id,
    },
  });

  const conversation = await prisma.conversation.create({
    data: {
      serviceRequestId: serviceRequest.id,
      professionalId: professional.id,
      requesterId: dbUser.id,
    },
    select: { id: true },
  });

  return NextResponse.json({ chatUrl: `/dashboard/messages/${conversation.id}` });
}
