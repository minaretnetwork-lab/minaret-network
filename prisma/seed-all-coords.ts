/**
 * Run with: npx tsx prisma/seed-all-coords.ts
 * Seeds GPS coordinates for all GTA mosques that currently lack them,
 * derived from their known street addresses.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Identified from street addresses in the DB
const coords: { nameContains: string; lat: number; lng: number }[] = [
  // Keswick / North GTA
  { nameContains: "Al-Falah Mosque",                  lat: 44.2519,  lng: -79.4580 },
  { nameContains: "Bradford Islamic",                  lat: 44.1176,  lng: -79.5593 },

  // Mississauga
  { nameContains: "Al-Huda Islamic Centre of Canada",  lat: 43.6076,  lng: -79.6478 },
  { nameContains: "Ali Islamic Mission",               lat: 43.5862,  lng: -79.6587 },
  { nameContains: "Bani Hashim",                       lat: 43.6340,  lng: -79.6105 },
  { nameContains: "Islamic Community Centre of Ontario", lat: 43.5485, lng: -79.7003 },
  { nameContains: "Islamic Propagation Centre",        lat: 43.5874,  lng: -79.6356 },
  { nameContains: "Islamic Society of Peel",           lat: 43.7384,  lng: -79.6950 },
  { nameContains: "ISNA Canada",                       lat: 43.5074,  lng: -79.6512 },
  { nameContains: "Jamia Islamia Centre Canada",       lat: 43.6200,  lng: -79.7000 },
  { nameContains: "Malton Islamic Centre",             lat: 43.7260,  lng: -79.6730 },
  { nameContains: "Muslim Association of Canada",      lat: 43.5264,  lng: -79.6546 },

  // Brampton
  { nameContains: "Ar-Rashaad Centre",                 lat: 43.7152,  lng: -79.7698 },
  { nameContains: "Jame-ul-Ansar",                     lat: 43.7500,  lng: -79.7300 },
  { nameContains: "Masjid Aqsa Brampton",              lat: 43.6875,  lng: -79.7444 },

  // Toronto / Scarborough / East End
  { nameContains: "Central Mosque Scarborough",        lat: 43.7544,  lng: -79.2425 },
  { nameContains: "Darul Khair",                       lat: 43.7118,  lng: -79.3356 },
  { nameContains: "Islamic Foundation of Toronto",     lat: 43.7810,  lng: -79.2621 },
  { nameContains: "Islamic Iranian Centre",            lat: 43.7126,  lng: -79.3226 },
  { nameContains: "Jami Mosque",                       lat: 43.6587,  lng: -79.4500 },
  { nameContains: "Masjid Subhan",                     lat: 43.7359,  lng: -79.2415 },
  { nameContains: "Muslim Circle of Canada",           lat: 43.7612,  lng: -79.1907 },
  { nameContains: "North York Islamic Community",      lat: 43.7430,  lng: -79.5148 },
  { nameContains: "Salaheddin",                        lat: 43.7312,  lng: -79.2750 },
  { nameContains: "Spiritual Society Canada",          lat: 43.7808,  lng: -79.1678 },
  { nameContains: "Zakariya Masjid",                   lat: 43.8058,  lng: -79.2207 },

  // Markham / Ajax / Durham
  { nameContains: "Masjid Darul Iman",                 lat: 43.9003,  lng: -79.2716 },
  { nameContains: "Masjid Quba",                       lat: 43.8820,  lng: -79.0228 },
];

async function main() {
  console.log("Seeding coordinates for remaining mosques...\n");

  for (const c of coords) {
    const mosque = await prisma.mosque.findFirst({
      where: {
        name: { contains: c.nameContains, mode: "insensitive" },
        isActive: true,
        OR: [{ latitude: null }, { longitude: null }],
      },
      select: { id: true, name: true },
    });

    if (!mosque) {
      console.warn(`  ⚠  Not found (or already has coords): "${c.nameContains}"`);
      continue;
    }

    await prisma.mosque.update({
      where: { id: mosque.id },
      data: { latitude: c.lat, longitude: c.lng },
    });

    console.log(`  ✓  ${mosque.name}`);
  }

  console.log("\nDone.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
