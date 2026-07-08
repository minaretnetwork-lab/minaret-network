export const dynamic = "force-dynamic";

import { ServiceRequestForm } from "@/components/service-request-form";
import { prisma } from "@/lib/prisma";
import { DEFAULT_MOSQUE_SLUG } from "@/lib/constants";

export const metadata = { title: "Request a Professional" };

export default async function RequestPage() {
  const mosque = await prisma.mosque.findUnique({
    where: { slug: DEFAULT_MOSQUE_SLUG },
    include: {
      categories: { where: { isActive: true }, orderBy: { name: "asc" } },
      serviceAreas: { orderBy: { name: "asc" } },
    },
  });

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Request a Professional</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Tell us what you need and we'll help connect you with the right professional.
        </p>
      </div>
      <ServiceRequestForm
        categories={mosque?.categories ?? []}
        serviceAreas={mosque?.serviceAreas ?? []}
      />
    </div>
  );
}
