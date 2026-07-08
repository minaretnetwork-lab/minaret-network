export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth";
import { ProfessionalRegistrationForm } from "@/components/professionals/registration-form";
import { prisma } from "@/lib/prisma";
import { DEFAULT_MOSQUE_SLUG } from "@/lib/constants";

export const metadata = { title: "Register as Professional" };

export default async function ProfessionalRegisterPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?redirectTo=/professionals/register");

  const [mosques, defaultMosque] = await Promise.all([
    prisma.mosque.findMany({
      where: { isActive: true },
      select: { id: true, name: true, city: true, communityChannelType: true, communityChannelName: true },
      orderBy: { name: "asc" },
    }),
    prisma.mosque.findUnique({
      where: { slug: DEFAULT_MOSQUE_SLUG },
      select: { categories: { where: { isActive: true }, orderBy: { name: "asc" } }, serviceAreas: { orderBy: { name: "asc" } } },
    }),
  ]);

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Join as a Professional
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
          Complete your profile to be listed in the Minaret Network directory. Your listing will be reviewed and approved by our administration.
        </p>
      </div>
      <ProfessionalRegistrationForm
        mosques={mosques}
        categories={defaultMosque?.categories ?? []}
        serviceAreas={defaultMosque?.serviceAreas ?? []}
      />
    </div>
  );
}
