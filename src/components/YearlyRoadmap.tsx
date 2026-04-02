export type ScheduledItem = {
  month: number; // 1–12
  label: string;
  completed?: boolean;
};

export type ActivityRow = {
  label: string;
  items: ScheduledItem[];
  infoUrl?: string;
  ongoing?: boolean;
};

export type ActivitySection = {
  heading: string;
  rows: ActivityRow[];
};

/**
 * Distribute a deliverable evenly across the year.
 * e.g. allocation=4 → months 3, 6, 9, 12 (quarterly)
 */
export function distributeAcrossYear(
  name: string,
  allocation: number,
  completedCount: number,
): ScheduledItem[] {
  if (allocation <= 0) return [];
  // For large allocations, show quarterly instead
  const effectiveAllocation = allocation > 12 ? 4 : allocation;
  const interval = 12 / effectiveAllocation;
  const items: ScheduledItem[] = [];
  for (let i = 0; i < effectiveAllocation; i++) {
    const month = Math.round(interval * (i + 1));
    items.push({
      month: Math.min(month, 12),
      label: name,
      completed: i < completedCount,
    });
  }
  return items;
}

/**
 * Create a single scheduled item for a fixed month.
 */
export function fixedMonthItem(
  name: string,
  month: number,
  completed: boolean,
): ScheduledItem {
  return { month, label: name, completed };
}

/**
 * Create scheduled items at specific fixed months.
 * Completions are marked in order (first N items marked completed).
 */
export function fixedMonthsItems(
  name: string,
  months: number[],
  completedCount: number,
): ScheduledItem[] {
  return months.map((month, i) => ({
    month,
    label: name,
    completed: i < completedCount,
  }));
}

export default function YearlyRoadmap({
  year,
  focuses,
  scheduledItems,
  activityRows,
  activitySections,
}: {
  year?: number;
  focuses?: { quarter: number; focus: string }[];
  scheduledItems?: ScheduledItem[];
  activityRows?: ActivityRow[];
  activitySections?: ActivitySection[];
}) {
  const now = new Date();
  const displayYear = year ?? now.getFullYear();

  // Compute progress through the year
  const startOfYear = new Date(displayYear, 0, 1);
  const endOfYear = new Date(displayYear + 1, 0, 1);
  const totalDays =
    (endOfYear.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24);

  const isCurrentYear = displayYear === now.getFullYear();
  const elapsed = isCurrentYear
    ? (now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)
    : displayYear < now.getFullYear()
      ? totalDays
      : 0;
  const progressPct = Math.min(Math.max((elapsed / totalDays) * 100, 0), 100);

  const months = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
  const quarters = [
    { label: "Q1", pct: 12.5 },
    { label: "Q2", pct: 37.5 },
    { label: "Q3", pct: 62.5 },
    { label: "Q4", pct: 87.5 },
  ];
  const quarterLines = [25, 50, 75];

  const hasActivityRows = activityRows && activityRows.length > 0;
  const hasActivitySections = activitySections && activitySections.length > 0;
  const hasLeftLabel = hasActivityRows || hasActivitySections;

  // Legacy: group flat scheduledItems by month (backward compat)
  const itemsByMonth = (scheduledItems ?? []).reduce<Record<number, ScheduledItem[]>>(
    (acc, item) => {
      if (!acc[item.month]) acc[item.month] = [];
      acc[item.month].push(item);
      return acc;
    },
    {},
  );
  const hasLegacyItems = !hasActivityRows && scheduledItems && scheduledItems.length > 0;

  return (
    <div className="bg-brand-navy text-white rounded-lg shadow-sm p-6 mb-8">
      <h3 className="text-lg font-bold mb-4">Yearly Road-map</h3>

      {/* Quarter labels */}
      <div className="relative h-5 mb-1" style={hasLeftLabel ? { marginLeft: 160 } : undefined}>
        {quarters.map((q) => (
          <span
            key={q.label}
            className="absolute text-xs font-medium opacity-70 -translate-x-1/2"
            style={{ left: `${q.pct}%` }}
          >
            {q.label}
          </span>
        ))}
      </div>

      {/* Progress bar */}
      <div className="relative w-full h-4 bg-white/20 rounded-full overflow-visible" style={hasLeftLabel ? { marginLeft: 160, width: 'calc(100% - 160px)' } : undefined}>
        {/* Green fill */}
        <div
          className="absolute inset-y-0 left-0 bg-brand-green rounded-full"
          style={{ width: `${progressPct}%` }}
        />

        {/* Quarter divider lines */}
        {quarterLines.map((pct) => (
          <div
            key={pct}
            className="absolute top-0 bottom-0 w-px bg-white/50"
            style={{ left: `${pct}%` }}
          />
        ))}

        {/* Today marker */}
        {isCurrentYear && (
          <div
            className="absolute -top-1 flex flex-col items-center"
            style={{ left: `${progressPct}%` }}
          >
            <div className="w-0.5 h-6 bg-white rounded-full -translate-x-1/2" />
            <span className="text-[10px] font-medium mt-0.5 whitespace-nowrap -translate-x-1/2">
              Today
            </span>
          </div>
        )}
      </div>

      {/* Month labels */}
      <div className="relative h-5 mt-5" style={hasLeftLabel ? { marginLeft: 160 } : undefined}>
        {months.map((m, i) => (
          <span
            key={i}
            className="absolute text-xs opacity-70 -translate-x-1/2"
            style={{ left: `${((i + 0.5) / 12) * 100}%` }}
          >
            {m}
          </span>
        ))}
      </div>

      {/* Quarterly areas of focus */}
      {focuses && focuses.length > 0 && (
        <div className={`grid grid-cols-4 gap-3 mt-5 pt-4 border-t border-white/20 ${hasLeftLabel ? 'ml-[160px]' : ''}`}>
          {[1, 2, 3, 4].map((q) => {
            const entry = focuses.find((f) => f.quarter === q);
            return (
              <div key={q} className="min-h-[2rem]">
                <div className="text-[10px] font-semibold uppercase tracking-wider opacity-50 mb-1">
                  Q{q} Focus
                </div>
                {entry ? (
                  <p className="text-xs leading-relaxed opacity-90">{entry.focus}</p>
                ) : (
                  <p className="text-xs opacity-30 italic">—</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Activity rows (new structured layout) */}
      {hasActivityRows && (
        <div className="mt-4 pt-4 border-t border-white/20 space-y-3">
          {activityRows.map((row) => {
            // Group items by month for this row
            const rowItemsByMonth = row.items.reduce<Record<number, ScheduledItem[]>>(
              (acc, item) => {
                if (!acc[item.month]) acc[item.month] = [];
                acc[item.month].push(item);
                return acc;
              },
              {},
            );

            // Calculate row height based on max stacked items in any month
            const maxStack = Math.max(1, ...Object.values(rowItemsByMonth).map((items) => items.length));

            return (
              <div key={row.label} className="flex items-start">
                {/* Row label */}
                <div className="w-[160px] flex-shrink-0 pr-4">
                  <span className="text-[10px] font-semibold uppercase tracking-wider opacity-60">
                    {row.label}
                  </span>
                </div>

                {/* Timeline area */}
                <div className="flex-1 relative" style={{ height: maxStack * 32 + 8 }}>
                  {/* Faint quarter dividers */}
                  {quarterLines.map((pct) => (
                    <div
                      key={pct}
                      className="absolute top-0 bottom-0 w-px bg-white/10"
                      style={{ left: `${pct}%` }}
                    />
                  ))}

                  {/* Items positioned at their month */}
                  {Object.entries(rowItemsByMonth)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([monthStr, items]) => {
                      const month = Number(monthStr);
                      const leftPct = ((month - 0.5) / 12) * 100;
                      return (
                        <div
                          key={month}
                          className="absolute flex flex-col items-center -translate-x-1/2"
                          style={{ left: `${leftPct}%`, top: 0 }}
                        >
                          {items.map((item, i) => (
                            <div
                              key={i}
                              className={`flex flex-col items-center mb-1 ${
                                item.completed ? 'opacity-50' : 'opacity-90'
                              }`}
                            >
                              <span
                                className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${
                                  item.completed ? 'bg-emerald-400' : 'bg-white/60'
                                }`}
                              />
                              <span
                                className={`text-[9px] mt-0.5 text-center leading-tight max-w-[70px] ${
                                  item.completed ? 'line-through' : ''
                                }`}
                              >
                                {item.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Activity sections (grouped rows with section headings) */}
      {hasActivitySections && (
        <div className="mt-4 pt-4 border-t border-white/20">
          {activitySections.map((section, sIdx) => (
            <div key={section.heading} className={`border border-white/20 rounded-lg p-3 ${sIdx > 0 ? 'mt-4' : ''}`}>
              {/* Section heading */}
              <div className="flex items-start mb-2 bg-white/10 rounded px-2 py-1.5">
                <div className="w-[144px] flex-shrink-0 pr-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider opacity-70">
                    {section.heading}
                  </span>
                </div>
              </div>

              {/* Individual deliverable rows */}
              <div>
                {section.rows.map((row, rIdx) => {
                  // Group this row's items by month
                  const rowItemsByMonth = row.items.reduce<Record<number, ScheduledItem[]>>(
                    (acc, item) => {
                      if (!acc[item.month]) acc[item.month] = [];
                      acc[item.month].push(item);
                      return acc;
                    },
                    {},
                  );

                  return (
                    <div key={row.label} className={`flex items-center rounded px-2 py-1.5 ${rIdx % 2 === 1 ? 'bg-white/5' : ''}`}>
                      {/* Row label */}
                      <div className="w-[144px] flex-shrink-0 pr-4 flex items-center gap-1.5">
                        <span className="text-[10px] opacity-60 leading-tight flex-1">
                          {row.label}
                        </span>
                        <span className="w-3.5 flex-shrink-0">
                          {row.infoUrl && (
                            <a
                              href={row.infoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative group"
                            >
                              <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-white/40 text-[8px] font-bold opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
                                i
                              </span>
                              <span className="absolute bottom-full right-0 mb-1.5 w-36 p-1.5 rounded-lg bg-gray-900 text-white text-[10px] leading-relaxed shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-10">
                                Click for Information
                              </span>
                            </a>
                          )}
                        </span>
                      </div>

                      {/* Timeline area */}
                      <div className="flex-1 relative h-5">
                        {/* Faint quarter dividers (hidden for ongoing rows) */}
                        {!row.ongoing && quarterLines.map((pct) => (
                          <div
                            key={pct}
                            className="absolute top-0 bottom-0 w-px bg-white/10"
                            style={{ left: `${pct}%` }}
                          />
                        ))}

                        {row.ongoing ? (
                          /* Ongoing: line — text — line */
                          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            <div className="flex-1 h-px bg-white/15" />
                            <span className="text-[8px] font-medium tracking-wider uppercase text-white/30 flex-shrink-0">Ongoing</span>
                            <div className="flex-1 h-px bg-white/15" />
                          </div>
                        ) : (
                          /* Dots for scheduled deliverables */
                          <>
                            {Object.entries(rowItemsByMonth)
                              .sort(([a], [b]) => Number(a) - Number(b))
                              .map(([monthStr, items]) => {
                                const month = Number(monthStr);
                                const leftPct = ((month - 0.5) / 12) * 100;
                                const item = items[0];
                                return (
                                  <div
                                    key={month}
                                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                                    style={{ left: `${leftPct}%` }}
                                  >
                                    <span
                                      className={`inline-block w-2.5 h-2.5 rounded-full ${
                                        item.completed ? 'bg-emerald-400' : 'bg-white/60'
                                      }`}
                                    />
                                  </div>
                                );
                              })}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Legacy flat scheduled items (backward compat) */}
      {hasLegacyItems && (
        <div className="mt-4 pt-4 border-t border-white/20">
          <div className="relative">
            {Object.entries(itemsByMonth)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([monthStr, items]) => {
                const month = Number(monthStr);
                const leftPct = ((month - 0.5) / 12) * 100;
                return (
                  <div
                    key={month}
                    className="inline-flex flex-col items-center absolute -translate-x-1/2"
                    style={{ left: `${leftPct}%` }}
                  >
                    {items.map((item, i) => (
                      <div
                        key={i}
                        className={`flex flex-col items-center mb-2 ${
                          item.completed ? 'opacity-50' : 'opacity-90'
                        }`}
                      >
                        <span
                          className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${
                            item.completed ? 'bg-emerald-400' : 'bg-white/60'
                          }`}
                        />
                        <span
                          className={`text-[9px] mt-1 text-center leading-tight max-w-[60px] ${
                            item.completed ? 'line-through' : ''
                          }`}
                        >
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })}
            <div style={{ height: Math.max(Object.keys(itemsByMonth).length > 0 ? 40 : 0, ...Object.values(itemsByMonth).map(items => items.length * 36)) }} />
          </div>
        </div>
      )}

    </div>
  );
}
