import { approveMosqueSuggestion, getMosqueSuggestions, getMosques } from "@/lib/actions/mosques";
import { MosqueManagement } from "@/components/admin/mosque-management";

export const metadata = { title: "Manage Mosques" };

export default async function AdminMosquesPage() {
  const [mosques, suggestions] = await Promise.all([getMosques(), getMosqueSuggestions()]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mosques</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Onboard mosques and configure their community channels. Professionals select their mosque when registering,
            and admins use the community channel link to verify affiliation before awarding the badge.
          </p>
        </div>
        <span className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm font-semibold text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
          {mosques.length} mosques
        </span>
      </div>
      <section className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5 dark:border-emerald-900/30 dark:bg-emerald-950/10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Mosque recommendations</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Submitted when a professional cannot find their mosque in the list.
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-emerald-700 shadow-sm dark:bg-gray-900 dark:text-emerald-300">
            {suggestions.length} pending / recent
          </span>
        </div>
        {suggestions.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-emerald-200 bg-white/70 p-4 text-sm text-gray-500 dark:border-emerald-900/40 dark:bg-gray-950/30 dark:text-gray-400">
            No mosque recommendations yet.
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            {suggestions.map((suggestion) => {
              const requestedBy = [suggestion.requestedBy.firstName, suggestion.requestedBy.lastName].filter(Boolean).join(" ") || suggestion.requestedBy.email;
              return (
                <article key={suggestion.id} className="rounded-xl border border-white bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{suggestion.name}</h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {[suggestion.city, suggestion.address].filter(Boolean).join(" · ") || "Location not provided"}
                      </p>
                    </div>
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                      {suggestion.status}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-gray-700 dark:text-gray-300 sm:grid-cols-2">
                    <p><span className="text-gray-400">Requested by:</span> {requestedBy}</p>
                    <p><span className="text-gray-400">Submitted:</span> {suggestion.createdAt.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}</p>
                    <p><span className="text-gray-400">Channel:</span> {suggestion.communityChannelName || suggestion.communityChannelType || "Not provided"}</p>
                    {suggestion.website && (
                      <p>
                        <span className="text-gray-400">Website:</span>{" "}
                        <a className="text-emerald-700 hover:underline dark:text-emerald-300" href={suggestion.website} target="_blank" rel="noreferrer">
                          {suggestion.website}
                        </a>
                      </p>
                    )}
                    {suggestion.communityChannelLink && (
                      <p className="sm:col-span-2">
                        <span className="text-gray-400">Community link:</span>{" "}
                        <a className="text-emerald-700 hover:underline dark:text-emerald-300" href={suggestion.communityChannelLink} target="_blank" rel="noreferrer">
                          {suggestion.communityChannelLink}
                        </a>
                      </p>
                    )}
                    {suggestion.notes && <p className="sm:col-span-2"><span className="text-gray-400">Notes:</span> {suggestion.notes}</p>}
                  </div>
                  {suggestion.status === "PENDING" && (
                    <form
                      action={async () => {
                        "use server";
                        await approveMosqueSuggestion(suggestion.id);
                      }}
                      className="mt-4"
                    >
                      <button
                        type="submit"
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                      >
                        Accept & add mosque
                      </button>
                    </form>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
      <MosqueManagement mosques={mosques as never} />
    </div>
  );
}
