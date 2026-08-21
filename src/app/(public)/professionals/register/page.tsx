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

  const existingProfessional = await prisma.professional.findFirst({
    where: { userId: user.id },
    select: { status: true },
  });
  if (existingProfessional) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-lg text-center">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-10 shadow-sm space-y-4">
          <div className="flex items-center justify-center h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mx-auto">
            <svg className="h-7 w-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">You&apos;re already registered</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {existingProfessional.status === "PENDING"
              ? "Your profile is currently under review. We'll notify you once it's approved."
              : existingProfessional.status === "APPROVED"
              ? "Your professional profile is live. Head to your dashboard to manage it."
              : "Your profile exists but may need attention. Check your dashboard for details."}
          </p>
          <a href="/dashboard/professional" className="inline-flex items-center justify-center w-full h-11 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold transition-colors">
            Go to my dashboard
          </a>
        </div>
      </div>
    );
  }

  let mosques: { id: string; name: string; city: string | null }[] = [];
  let categories: { id: string; name: string; slug: string; icon: string | null }[] = [];
  let serviceAreas: { id: string; name: string }[] = [];

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
          serviceAreas: { select: { id: true, name: true }, orderBy: { name: "asc" } },
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
