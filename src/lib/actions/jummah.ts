"use server";

import { prisma } from "@/lib/prisma";

export type JummahSession = {
  session: string;
  khutbahTime: string | null;
  iqamahTime: string | null;
  notes: string | null;
  lastReportedAt: Date;
};

export type MosqueWithJummah = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  address: string | null;
  website: string | null;
  latitude: number | null;
  longitude: number | null;
  timings: JummahSession[];
};

export async function getMosquesWithJummahTimings(): Promise<MosqueWithJummah[]> {
  const mosques = await prisma.mosque.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      city: true,
      address: true,
      website: true,
      latitude: true,
      longitude: true,
      jummahTimings: {
        orderBy: { session: "asc" },
        select: {
          session: true,
          khutbahTime: true,
          iqamahTime: true,
          notes: true,
          lastReportedAt: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return mosques.map((m) => ({
    ...m,
    timings: m.jummahTimings,
  }));
}

export type SubmitCorrectionInput = {
  mosqueId: string;
  session?: string;
  proposedKhutbahTime?: string;
  proposedIqamahTime?: string;
  submitterEmail?: string;
  submitterNote?: string;
};

export async function submitJummahCorrection(data: SubmitCorrectionInput) {
  if (!data.mosqueId) throw new Error("Mosque is required.");
  if (!data.proposedKhutbahTime && !data.proposedIqamahTime && !data.submitterNote) {
    throw new Error("Please provide at least one corrected time or a note.");
  }

  await prisma.jummahTimingReport.create({
    data: {
      mosqueId: data.mosqueId,
      session: data.session || null,
      proposedKhutbahTime: data.proposedKhutbahTime || null,
      proposedIqamahTime: data.proposedIqamahTime || null,
      submitterEmail: data.submitterEmail || null,
      submitterNote: data.submitterNote || null,
    },
  });
}
