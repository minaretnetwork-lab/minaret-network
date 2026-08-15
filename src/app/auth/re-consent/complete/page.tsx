import Link from "next/link";

export default function ReConsentCompletePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Thank You
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Your consent has been received.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          Please stay tuned for site restoration and further updates about your listing.
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
