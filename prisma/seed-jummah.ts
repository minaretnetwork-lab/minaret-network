/**
 * Run with:  npx tsx prisma/seed-jummah.ts
 * Seeds Jummah timings for GTA mosques scraped from their websites (Aug 2026).
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type SessionInput = {
  session: string;
  khutbahTime?: string;
  iqamahTime?: string;
  notes?: string;
};

type MosqueData = {
  nameContains: string;
  sessions: SessionInput[];
};

const data: MosqueData[] = [
  {
    nameContains: "Al Ansar",
    sessions: [
      { session: "J1", iqamahTime: "1:30 PM" },
      { session: "J2", iqamahTime: "2:45 PM" },
    ],
  },
  {
    nameContains: "Baitul Mukarram",
    sessions: [
      { session: "J1", iqamahTime: "1:45 PM" },
      { session: "J2", iqamahTime: "2:45 PM" },
      { session: "J3", iqamahTime: "3:45 PM" },
    ],
  },
  {
    nameContains: "Bosnian Islamic Assoc",
    sessions: [
      { session: "J1", iqamahTime: "1:30 PM" },
      { session: "J2", iqamahTime: "2:30 PM" },
    ],
  },
  {
    nameContains: "Bosnian Islamic Centre",
    sessions: [
      { session: "J1", iqamahTime: "1:30 PM", notes: "Winter schedule" },
      { session: "J2", iqamahTime: "2:30 PM", notes: "Winter schedule" },
    ],
  },
  {
    nameContains: "Brampton Islamic",
    sessions: [
      { session: "J1", khutbahTime: "1:45 PM", iqamahTime: "2:10 PM" },
      { session: "J2", khutbahTime: "2:55 PM", iqamahTime: "3:15 PM" },
    ],
  },
  {
    nameContains: "Dar-Ul-Hijra",
    sessions: [
      { session: "J1", khutbahTime: "1:30 PM" },
    ],
  },
  {
    nameContains: "Darul Arqam Islamic Academy",
    sessions: [
      { session: "J1", iqamahTime: "2:00 PM" },
    ],
  },
  {
    nameContains: "Darul-Arqam Musalla",
    sessions: [
      { session: "J1", khutbahTime: "1:40 PM" },
      { session: "J2", khutbahTime: "2:30 PM" },
      { session: "J3", khutbahTime: "3:15 PM" },
    ],
  },
  {
    nameContains: "Durham Islamic",
    sessions: [
      { session: "J1", iqamahTime: "2:00 PM", notes: "Iqra location" },
      { session: "J2", iqamahTime: "3:00 PM", notes: "Iqra location" },
      { session: "J3", iqamahTime: "4:00 PM", notes: "Iqra location" },
    ],
  },
  {
    nameContains: "Faizan-e-Madina",
    sessions: [
      { session: "J1", iqamahTime: "2:00 PM" },
      { session: "J2", iqamahTime: "2:45 PM" },
    ],
  },
  {
    nameContains: "Oakville",
    sessions: [
      { session: "J1", khutbahTime: "12:30 PM", iqamahTime: "1:00 PM" },
      { session: "J2", khutbahTime: "1:20 PM", iqamahTime: "1:45 PM" },
    ],
  },
  {
    nameContains: "Jaffari",
    sessions: [
      { session: "J1", iqamahTime: "12:50 PM", notes: "Shia Jumu'ah" },
    ],
  },
  {
    nameContains: "Sayyidah Zainab",
    sessions: [
      { session: "J1", iqamahTime: "2:00 PM" },
      { session: "J2", iqamahTime: "3:00 PM" },
      { session: "J3", iqamahTime: "4:15 PM" },
    ],
  },
  {
    nameContains: "Masjid Al Aqsaa",
    sessions: [
      { session: "J1", iqamahTime: "2:00 PM" },
      { session: "J2", iqamahTime: "3:00 PM" },
      { session: "J3", iqamahTime: "3:45 PM" },
    ],
  },
  {
    nameContains: "Masjid Al-Abrar",
    sessions: [
      { session: "J1", khutbahTime: "1:30 PM", iqamahTime: "1:55 PM" },
    ],
  },
  {
    nameContains: "Masjid E Noor",
    sessions: [
      { session: "J1", khutbahTime: "1:35 PM", notes: "English session" },
      { session: "J2", khutbahTime: "2:00 PM" },
    ],
  },
  {
    nameContains: "Masjid Toronto",
    sessions: [
      { session: "J1", iqamahTime: "12:10 PM", notes: "Dundas & Adelaide locations" },
      { session: "J2", iqamahTime: "1:10 PM", notes: "Dundas & Adelaide locations" },
      { session: "J3", iqamahTime: "2:10 PM", notes: "Dundas & Adelaide locations" },
    ],
  },
  {
    nameContains: "Masjid Usman",
    sessions: [
      { session: "J1", iqamahTime: "2:00 PM" },
      { session: "J2", iqamahTime: "3:45 PM" },
      { session: "J3", iqamahTime: "4:45 PM" },
    ],
  },
  {
    nameContains: "Masjid Vaughan",
    sessions: [
      { session: "J1", khutbahTime: "1:35 PM", iqamahTime: "2:00 PM" },
    ],
  },
  {
    nameContains: "Farooq",
    sessions: [
      { session: "J1", khutbahTime: "1:00 PM" },
      { session: "J2", khutbahTime: "2:00 PM" },
      { session: "J3", khutbahTime: "3:00 PM" },
      { session: "J4", khutbahTime: "4:00 PM" },
    ],
  },
  {
    nameContains: "Newmarket",
    sessions: [
      { session: "J1", khutbahTime: "1:30 PM", iqamahTime: "2:00 PM" },
      { session: "J2", khutbahTime: "2:30 PM", iqamahTime: "3:00 PM" },
    ],
  },
  {
    nameContains: "Rexdale",
    sessions: [
      { session: "J1", iqamahTime: "2:00 PM" },
      { session: "J2", iqamahTime: "3:15 PM" },
    ],
  },
  {
    nameContains: "Shalimar",
    sessions: [
      { session: "J1", khutbahTime: "1:35 PM" },
      { session: "J2", khutbahTime: "2:35 PM" },
    ],
  },
  {
    nameContains: "TARIC",
    sessions: [
      { session: "J1", iqamahTime: "1:30 PM" },
    ],
  },
  {
    nameContains: "Uma Nabawi",
    sessions: [
      { session: "J1", khutbahTime: "1:10 PM", iqamahTime: "1:45 PM" },
      { session: "J2", khutbahTime: "2:10 PM", iqamahTime: "2:45 PM" },
    ],
  },
];

async function main() {
  console.log("Seeding Jummah timings...");

  for (const entry of data) {
    const mosque = await prisma.mosque.findFirst({
      where: {
        name: { contains: entry.nameContains, mode: "insensitive" },
        isActive: true,
      },
      select: { id: true, name: true },
    });

    if (!mosque) {
      console.warn(`  ⚠  No mosque found matching "${entry.nameContains}"`);
      continue;
    }

    for (const s of entry.sessions) {
      await prisma.jummahTiming.upsert({
        where: { mosqueId_session: { mosqueId: mosque.id, session: s.session } },
        create: {
          mosqueId: mosque.id,
          session: s.session,
          khutbahTime: s.khutbahTime ?? null,
          iqamahTime: s.iqamahTime ?? null,
          notes: s.notes ?? null,
          lastReportedAt: new Date("2026-08-28"),
        },
        update: {
          khutbahTime: s.khutbahTime ?? null,
          iqamahTime: s.iqamahTime ?? null,
          notes: s.notes ?? null,
          lastReportedAt: new Date("2026-08-28"),
        },
      });
    }

    console.log(`  ✓  ${mosque.name} — ${entry.sessions.length} session(s)`);
  }

  console.log("Done.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
