import Link from "next/link";
import { getLegacyListingConsentContext, reAcceptTos } from "@/lib/actions/auth";
import { ReConsentSubmitButton } from "./submit-button";

export default async function ReConsentPage({
  searchParams,
}: {
  searchParams?: Promise<{ source?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const listingConsent = await getLegacyListingConsentContext();
  const hasListingsAwaitingConsent = listingConsent.listingCount > 0;
  const hasMosqueAffiliation = listingConsent.mosqueNames.length > 0;
  const isConsentFlow = params.source === "listing-restoration";

  if (isConsentFlow && !hasListingsAwaitingConsent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Thank you
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-8">
            This consent request was not intended for your account.
          </p>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-green-600 px-5 text-sm font-medium text-white transition-colors hover:bg-green-700"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-12">
      <div className="w-full max-w-md">
        <form action={reAcceptTos} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 shadow-sm">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {isConsentFlow ? "Confirm Your Consent" : "Updated Terms & Privacy Policy"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {isConsentFlow
              ? "Please confirm the items below so we can keep your information on file while Minaret Network completes site restoration and listing updates."
              : "We&apos;ve updated our Terms of Service and Privacy Policy. Please review and re-accept them to continue using Minaret Network."}
          </p>
          {isConsentFlow && <input type="hidden" name="flow" value="listing-restoration" />}

          <div className="space-y-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 mb-6">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                name="ageAttested"
                required
                className="mt-0.5 flex-shrink-0 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                I confirm I am <strong>18 years of age or older</strong>
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                name="tosAccepted"
                required
                className="mt-0.5 flex-shrink-0 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                I agree to the{" "}
                <Link href="/terms" className="text-green-700 hover:underline">Terms of Service</Link>
                {" "}and{" "}
                <Link href="/privacy" className="text-green-700 hover:underline">Privacy Policy</Link>
              </span>
            </label>

            {hasListingsAwaitingConsent && (
              <>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    name="listingConsent"
                    required
                    className="mt-0.5 flex-shrink-0 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    I confirm my professional listing information is accurate and consent to it being published publicly on Minaret Network. I understand Minaret Network is a community directory and does not verify professional credentials or services.
                  </span>
                </label>

                {hasMosqueAffiliation && (
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      name="mosqueAffiliationConsent"
                      required
                      className="mt-0.5 flex-shrink-0 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      I confirm I am an active member of {listingConsent.mosqueNames.join(" and ")} (as a regular attendee or community-channel member), and I consent to that affiliation being displayed publicly on my listing. I understand I can update or remove it at any time.
                    </span>
                  </label>
                )}
              </>
            )}
          </div>

          {hasListingsAwaitingConsent && (
            <p className="mb-6 text-sm text-green-800 dark:text-green-300">
              {isConsentFlow
                ? "Once you accept, we&apos;ll save your consent and keep you posted as listing restoration moves forward."
                : "Once you accept, your consent details will be saved to your account."}
            </p>
          )}

          <ReConsentSubmitButton />
        </form>
      </div>
    </div>
  );
}
