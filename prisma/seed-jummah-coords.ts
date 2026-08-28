/**
 * Run with: npx tsx prisma/seed-jummah-coords.ts
 * Seeds approximate lat/lng for GTA mosques so "Near me" sorting works.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const coords: { nameContains: string; lat: number; lng: number }[] = [
  { nameContains: "Al Ansar",              lat: 43.5890, lng: -79.7290 },
  { nameContains: "Baitul Mukarram",       lat: 43.7000, lng: -79.4500 },
  { nameContains: "Bosnian Islamic Assoc", lat: 43.7527, lng: -79.2872 },
  { nameContains: "Bosnian Islamic Centre",lat: 43.6500, lng: -79.4200 },
  { nameContains: "Brampton Islamic",      lat: 43.6876, lng: -79.7591 },
  { nameContains: "Dar-Ul-Hijra",          lat: 43.7841, lng: -79.2308 },
  { nameContains: "Darul Arqam Islamic Academy", lat: 43.7200, lng: -79.3100 },
  { nameContains: "Darul-Arqam Musalla",   lat: 43.6600, lng: -79.3900 },
  { nameContains: "Durham Islamic",        lat: 43.8700, lng: -78.8600 },
  { nameContains: "Faizan-e-Madina",       lat: 43.7100, lng: -79.4000 },
  { nameContains: "Oakville",              lat: 43.4478, lng: -79.6762 },
  { nameContains: "Jaffari",               lat: 43.8195, lng: -79.4124 },
  { nameContains: "Sayyidah Zainab",       lat: 43.7100, lng: -79.3500 },
  { nameContains: "Masjid Al Aqsaa",       lat: 43.8508, lng: -79.0204 },
  { nameContains: "Masjid Al-Abrar",       lat: 44.0065, lng: -79.4667 },
  { nameContains: "Masjid E Noor",         lat: 43.6600, lng: -79.3900 },
  { nameContains: "Masjid Toronto",        lat: 43.6534, lng: -79.3864 },
  { nameContains: "Masjid Usman",          lat: 43.8354, lng: -79.0847 },
  { nameContains: "Masjid Vaughan",        lat: 43.7866, lng: -79.5239 },
  { nameContains: "Farooq",                lat: 43.7500, lng: -79.2500 },
  { nameContains: "Rexdale",              lat: 43.7278, lng: -79.5812 },
  { nameContains: "Shalimar",             lat: 43.5765, lng: -79.6553 },
  { nameContains: "TARIC",               lat: 43.6990, lng: -79.4490 },
  { nameContains: "Uma Nabawi",           lat: 43.7249, lng: -79.5561 },
];

async function main() {
  console.log("Seeding mosque coordinates...");
  for (const c of coords) {
    const mosque = await prisma.mosque.findFirst({
      where: { name: { contains: c.nameContains, mode: "insensitive" }, isActive: true },
      select: { id: true, name: true },
    });
    if (!mosque) {
      console.warn(`  ⚠  Not found: "${c.nameContains}"`);
      continue;
    }
    await prisma.mosque.update({
      where: { id: mosque.id },
      data: { latitude: c.lat, longitude: c.lng },
    });
    console.log(`  ✓  ${mosque.name}`);
  }
  console.log("Done.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
