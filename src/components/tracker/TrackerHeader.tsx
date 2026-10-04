import { longDate } from "@/lib/tracker-metrics";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function TrackerHeader({
  updatedAt,
  lastDate,
}: {
  updatedAt: string;
  lastDate: string | null;
}) {
  return (
    <header className="@container">
      <div className="flex flex-col gap-3 border-l-[3px] border-crimson pl-4 @2xl:flex-row @2xl:items-center @2xl:justify-between @2xl:gap-6">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${basePath}/ssp-logo.png`}
            alt="Spider Sense Picks"
            width={40}
            height={40}
            className="h-10 w-10 flex-none rounded-[9px]"
          />
          <div>
            <p className="eyebrow">Spider Sense Picks</p>
            <h1 className="m-0 text-[26px] font-semibold leading-tight tracking-[-0.02em]">
              Results Tracker
            </h1>
          </div>
        </div>
        <div className="text-xs text-muted @2xl:text-right">
          <p className="m-0">Updated {updatedAt}</p>
          <p className="m-0">
            {lastDate ? `Results through ${longDate(lastDate)} · ` : ""}
            Reporting timezone: Toronto
          </p>
        </div>
      </div>
      <p className="mt-3 text-muted">
        Model-driven selections. A record you can review.
      </p>
      <p className="mt-4 rounded-control border border-line bg-surface px-3 py-2 text-[13px] text-muted">
        All posted picks, wins and losses alike. Pushes are shown but excluded
        from win rate.
      </p>
    </header>
  );
}
