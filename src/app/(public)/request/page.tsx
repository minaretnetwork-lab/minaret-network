export const dynamic = "force-dynamic";

import Link from "next/link";
import { LogIn, UserPlus } from "lucide-react";
import { ServiceRequestForm } from "@/components/service-request-form";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { DEFAULT_MOSQUE_SLUG } from "@/lib/constants";
import { getCurrentUser } from "@/lib/actions/auth";

export const metadata = { title: "Service Request | Minaret Network" };

export default async function RequestPage() {
  const [user, mosque] = await Promise.all([
    getCurrentUser().catch(() => null),
    prisma.mosque.findUnique({
      where: { slug: DEFAULT_MOSQUE_SLUG },
      include: {
        categories: { where: { isActive: true }, orderBy: { name: "asc" } },
        serviceAreas: { orderBy: { name: "asc" } },
      },
    }),
  ]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-start py-12 px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2" style={{ fontFamily: "var(--font-lora)" }}>
            Find a professional
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Answer a few quick questions and mosque-affiliated professionals will reach out to you.
          </p>
        </div>

        {!user ? (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 text-center shadow-sm">
            <div className="h-14 w-14 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto mb-4">
              <LogIn className="h-7 w-7 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2" style={{ fontFamily: "var(--font-lora)" }}>
              Sign in to submit a request
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              You need an account so professionals can reach you and you can track your requests.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/auth/login?redirectTo=/request">
                <Button className="w-full sm:w-auto bg-[#14532d] hover:bg-[#166534] text-white gap-2">
                  <LogIn className="h-4 w-4" /> Sign in
                </Button>
              </Link>
              <Link href="/auth/signup?redirectTo=/request">
                <Button variant="outline" className="w-full sm:w-auto gap-2 border-gray-200">
                  <UserPlus className="h-4 w-4" /> Create account
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <ServiceRequestForm
            categories={mosque?.categories ?? []}
            serviceAreas={mosque?.serviceAreas ?? []}
            defaultName={user.displayName ?? [user.firstName, user.lastName].filter(Boolean).join(" ") ?? ""}
            defaultEmail={user.email ?? ""}
            defaultPhone={user.phone ?? ""}
          />
        )}
      </div>
    </div>
  );
}
