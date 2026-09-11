import type { SeasonStats } from "@/lib/types";
import { formatMoney, formatSigned } from "@/lib/stats";

export function SportAnalysis({ stats }: { stats: SeasonStats }) {
  const decided = stats.wins + stats.losses;
  const record =
    decided > 0
      ? `${stats.wins}-${stats.losses}${stats.pushes ? `-${stats.pushes}` : ""}`
      : "—";

  return (
    <div className="panel overflow-hidden">
      <div className="border-b border-border px-5 py-6 sm:px-7">
        <p className="section-label">Where edge lives</p>
        <h2 className="section-title">Pick Analysis</h2>
        <p className="section-copy">
          Overall pick hit rate and performance by sport — sorted by profit so
          you can see what deserves more focus.
        </p>
      </div>

      <div className="grid gap-px border-b border-border bg-border sm:grid-cols-3">
        <SummaryCell
          label="Pick Win Rate"
          value={`${stats.winRate.toFixed(1)}%`}
          foot={`${record} on ${stats.settledPicks} settled picks`}
          tone="gold"
        />
        <SummaryCell
          label="Best Sport"
          value={stats.bestSport?.sport ?? "—"}
          foot={
            stats.bestSport
              ? `${formatSigned(stats.bestSport.units)}u · ${stats.bestSport.winRate.toFixed(1)}% hit`
              : "No settled sports yet"
          }
          tone="gold"
        />
        <SummaryCell
          label="Worst Sport"
          value={stats.worstSport?.sport ?? "—"}
          foot={
            stats.worstSport
              ? `${formatSigned(stats.worstSport.units)}u · ${stats.worstSport.winRate.toFixed(1)}% hit`
              : "No settled sports yet"
          }
          tone="red"
        />
      </div>

      {stats.bySport.length === 0 ? (
        <p className="px-6 py-10 text-center text-sm text-muted">
          No settled picks to analyze yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
                <th className="px-5 py-3 font-medium sm:px-7">Sport</th>
                <th className="px-3 py-3 font-medium">Picks</th>
                <th className="px-3 py-3 font-medium">Record</th>
                <th className="px-3 py-3 font-medium">Win Rate</th>
                <th className="px-3 py-3 text-right font-medium">Profit</th>
                <th className="px-5 py-3 text-right font-medium sm:px-7">
                  At $100/u
                </th>
              </tr>
            </thead>
            <tbody>
              {stats.bySport.map((s) => {
                const sportRecord = `${s.wins}-${s.losses}${
                  s.pushes ? `-${s.pushes}` : ""
                }`;
                return (
                  <tr
                    key={s.sport}
                    className="border-t border-border/80 transition hover:bg-gold/[0.03]"
                  >
                    <td className="px-5 py-3.5 sm:px-7">
                      <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                        {s.sport}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 font-[family-name:var(--font-mono)] text-sm text-foreground">
                      {s.picks}
                    </td>
                    <td className="px-3 py-3.5 font-[family-name:var(--font-mono)] text-sm text-muted">
                      {sportRecord}
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10 sm:w-24">
                          <div
                            className={`h-full rounded-full ${
                              s.winRate >= 50 ? "bg-gold" : "bg-brand-red"
                            }`}
                            style={{ width: `${Math.min(100, s.winRate)}%` }}
                          />
                        </div>
                        <span
                          className={`font-[family-name:var(--font-mono)] text-sm ${
                            s.winRate >= 50
                              ? "text-gold-bright"
                              : "text-red-bright"
                          }`}
                        >
                          {s.winRate.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td
                      className={`px-3 py-3.5 text-right font-[family-name:var(--font-mono)] text-sm ${
                        s.units >= 0 ? "text-gold-bright" : "text-red-bright"
                      }`}
                    >
                      {formatSigned(s.units)}u
                    </td>
                    <td
                      className={`px-5 py-3.5 text-right font-[family-name:var(--font-mono)] text-sm sm:px-7 ${
                        s.profitAt100 >= 0
                          ? "text-gold-bright"
                          : "text-red-bright"
                      }`}
                    >
                      {formatMoney(s.profitAt100)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SummaryCell({
  label,
  value,
  foot,
  tone,
}: {
  label: string;
  value: string;
  foot: string;
  tone: "gold" | "red";
}) {
  return (
    <div className="bg-[#0c0c0c] px-5 py-5 sm:px-7">
      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
        {label}
      </p>
      <p
        className={`mt-2 font-[family-name:var(--font-display)] text-[1.85rem] leading-none tracking-tight ${
          tone === "red" ? "text-red-bright" : "text-gold-bright"
        }`}
      >
        {value}
      </p>
      <p className="mt-2 text-xs text-muted">{foot}</p>
    </div>
  );
}
