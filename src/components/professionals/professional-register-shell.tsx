"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ProfessionalRegistrationForm,
  type ProfessionalFormInitialData,
} from "@/components/professionals/registration-form";

type Mosque = { id: string; name: string; city: string | null };
type Category = { id: string; name: string; slug: string; icon: string | null };
type ServiceArea = { id: string; name: string };

type Props = {
  mosques: Mosque[];
  categories: Category[];
  serviceAreas: ServiceArea[];
  initialData?: ProfessionalFormInitialData | null;
  mode?: "create" | "edit";
};

export function ProfessionalRegisterShell({
  mosques,
  categories,
  serviceAreas,
  initialData = null,
  mode = "create",
}: Props) {
  const [submitted, setSubmitted] = useState(false);
  const isEdit = mode === "edit";

  return (
    <>
      {!submitted && !isEdit && (
        <Link
          href="/dashboard"
          className="mt-4 inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
        >
          I&apos;ll do this later
        </Link>
      )}
      <div className="mt-10">
        <ProfessionalRegistrationForm
          mosques={mosques}
          categories={categories}
          serviceAreas={serviceAreas}
          initialData={initialData}
          mode={mode}
          onSubmitted={() => setSubmitted(true)}
        />
      </div>
    </>
  );
}
