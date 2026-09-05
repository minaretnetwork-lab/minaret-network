import { prisma } from "@/lib/prisma";
import { CreateProfessionalForm } from "@/components/admin/create-professional-form";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const metadata = { title: "Create Business Listing" };

export default async function AdminCreateProfessionalPage() {
  const [categories, serviceAreas] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true, icon: true },
      orderBy: { name: "asc" },
    }),
    prisma.serviceArea.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/professionals"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-emerald-700 mb-4 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Professionals
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Business Listing</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Seed a business profile that the owner can later claim. No mosque affiliation is set — the business owner
          adds that when they claim their profile.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
        <CreateProfessionalForm categories={categories} serviceAreas={serviceAreas} />
      </div>
    </div>
  );
}
