import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const mosques = await prisma.mosque.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, city: true },
  });
  return NextResponse.json({ mosques });
}
