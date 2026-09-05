export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth";
import { ProfessionalRegisterShell } from "@/components/professionals/professional-register-shell";
import { prisma } from "@/lib/prisma";
import { DEFAULT_MOSQUE_SLUG, CURRENT_TOS_VERSION } from "@/lib/constants";

export const metadata = { title: "Register as Professional" };

export default async function ProfessionalRegisterPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?redirectTo=/professionals/register");
  if (!user.tosVersion || user.tosVersion !== CURRENT_TOS_VERSION) redirect("/auth/re-consent");

  let mosques: { id: string; name: string; city: string | null }[] = [];
  let categories: { id: string; name: string; slug: string; icon: string | null }[] = [];
  let serviceAreas: { id: string; name: string; slug: string }[] = [];

  try {
    const [mosqueList, defaultMosque] = await Promise.all([
      prisma.mosque.findMany({
        where: { isActive: true },
        select: { id: true, name: true, city: true },
        orderBy: { name: "asc" },
      }),
      prisma.mosque.findUnique({
        where: { slug: DEFAULT_MOSQUE_SLUG },
        select: {
          categories: { where: { isActive: true }, select: { id: true, name: true, slug: true, icon: true }, orderBy: { name: "asc" } },
          serviceAreas: { select: { id: true, name: true, slug: true }, orderBy: { name: "asc" } },
        },
      }),
    ]);
    mosques = mosqueList;
    categories = defaultMosque?.categories ?? [];
    serviceAreas = defaultMosque?.serviceAreas ?? [];
  } catch (err) {
    console.error("register page db error:", err);
  }

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
      <ProfessionalRegisterShell
        mosques={mosques}
        categories={categories}
        serviceAreas={serviceAreas}
      />
    </div>
  );
}
