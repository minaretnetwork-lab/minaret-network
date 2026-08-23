import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/actions/auth";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await getCurrentUser().catch(() => null);
  if (!user) {
    return NextResponse.json({ ok: false, error: "You must be signed in to claim a profile." }, { status: 401 });
  }

  const professional = await prisma.professional.findUnique({
    where: { id },
    select: { id: true, isAdminCreated: true, claimedByUserId: true, status: true },
  });

  if (!professional || professional.status !== "APPROVED") {
    return NextResponse.json({ ok: false, error: "Profile not found." }, { status: 404 });
  }
  if (!professional.isAdminCreated) {
    return NextResponse.json({ ok: false, error: "This profile is not eligible for claiming." }, { status: 400 });
  }
  if (professional.claimedByUserId) {
    return NextResponse.json({ ok: false, error: "This profile has already been claimed." }, { status: 409 });
  }

  const existing = await prisma.profileClaim.findUnique({
    where: { professionalId_userId: { professionalId: id, userId: user.id } },
  });
  if (existing) {
    if (existing.status === "PENDING") {
      return NextResponse.json({ ok: false, error: "You already have a pending claim for this profile." }, { status: 409 });
    }
    if (existing.status === "REJECTED") {
      return NextResponse.json({ ok: false, error: "Your previous claim for this profile was rejected. Please contact us directly." }, { status: 409 });
    }
  }

  const body = await req.json().catch(() => ({}));
  const claimantName = String(body.claimantName ?? "").trim();
  const claimantEmail = String(body.claimantEmail ?? "").trim();
  const claimantPhone = String(body.claimantPhone ?? "").trim() || null;
  const claimantNote = String(body.claimantNote ?? "").trim();
  const consentGiven = body.consentGiven === true;

  if (!consentGiven) {
    return NextResponse.json({ ok: false, error: "You must confirm you are 18+ and agree to the terms." }, { status: 400 });
  }
  if (!claimantName) return NextResponse.json({ ok: false, error: "Name is required." }, { status: 400 });
  if (!claimantEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(claimantEmail)) {
    return NextResponse.json({ ok: false, error: "A valid email is required." }, { status: 400 });
  }
  if (!claimantNote || claimantNote.length < 20) {
    return NextResponse.json({ ok: false, error: "Please explain your connection to this business (at least 20 characters)." }, { status: 400 });
  }

  await prisma.profileClaim.create({
    data: {
      id: randomUUID().replace(/-/g, "").substring(0, 25),
      professionalId: id,
      userId: user.id,
      claimantName,
      claimantEmail,
      claimantPhone,
      claimantNote,
      status: "PENDING",
    },
  });

  return NextResponse.json({ ok: true });
}
