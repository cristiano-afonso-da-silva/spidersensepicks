import { TrackerApp } from "@/components/tracker/TrackerApp";
import { readPicks } from "@/lib/picks-store";

export default async function HomePage() {
  const picks = await readPicks();
  const updatedAt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Toronto",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date());

  return <TrackerApp picks={picks} updatedAt={updatedAt} />;
}
