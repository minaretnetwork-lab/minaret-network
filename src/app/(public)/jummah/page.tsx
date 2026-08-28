export const dynamic = "force-dynamic";

import { getMosquesWithJummahTimings } from "@/lib/actions/jummah";
import { JummahFinder } from "@/components/jummah/jummah-finder";

export const metadata = {
  title: "Never Miss a Jumu'ah",
  description:
    "Find Jumu'ah prayer times at mosques across the GTA. Search by location or mosque name, and help keep timings accurate.",
};

export default async function JummahPage() {
  const mosques = await getMosquesWithJummahTimings();
  return <JummahFinder mosques={mosques} />;
}
