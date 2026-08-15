export const dynamic = "force-dynamic";

import Link from "next/link";
import { getMyConversations } from "@/lib/actions/messages";
import { MessagesList } from "@/components/dashboard/messages-list";

export default async function MessagesPage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const view = resolvedSearchParams?.view === "archived" ? "archived" : "active";
  const { currentUserId, conversations, counts } = await getMyConversations(view);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-gray-900 dark:text-white">Messages</h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Keep track of conversations connected to service requests.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/dashboard/messages"
          className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-medium ${
            view === "active"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border border-gray-200 bg-white text-gray-600 transition hover:border-gray-300 hover:text-gray-900"
          }`}
        >
          Active
          <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-xs text-emerald-700">{counts.active}</span>
        </Link>
        <Link
          href="/dashboard/messages?view=archived"
          className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-medium ${
            view === "archived"
              ? "border border-gray-300 bg-gray-100 text-gray-900"
              : "border border-gray-200 bg-white text-gray-600 transition hover:border-gray-300 hover:text-gray-900"
          }`}
        >
          Archived
          <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{counts.archived}</span>
        </Link>
      </div>

      <MessagesList currentUserId={currentUserId} conversations={conversations} view={view} />
    </div>
  );
}
