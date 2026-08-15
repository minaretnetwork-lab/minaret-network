import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export const metadata = { title: "Listing Submitted | Minaret Network" };

export default function EventSubmitSuccessPage() {
  return (
    <main className="min-h-[70vh] bg-white dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
        </div>
        <div>
          <h1
            className="text-2xl font-bold text-gray-900 dark:text-white"
            style={{ fontFamily: "var(--font-lora)" }}
          >
            Your listing is live
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            Payment confirmed. Your event listing is now visible to the community and will run
            until your event date or 30 days, whichever comes first.
          </p>
        </div>
        <Link
          href="/events"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-800 transition-colors"
        >
          View Events
        </Link>
      </div>
    </main>
  );
}
