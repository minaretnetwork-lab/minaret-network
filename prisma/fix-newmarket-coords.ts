import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
async function main() {
  const m = await p.mosque.update({
    where: { id: "cmt34lsjg000080icf8x6c4ss" },
    data: { latitude: 44.0592, longitude: -79.4611 },
  });
  console.log("Updated:", m.name, m.latitude, m.longitude);
  await p.$disconnect();
}
main().catch(console.error);
