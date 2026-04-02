'use client';

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

type ContactCount = {
  id: string;
  year: number;
  month: number;
  contactCount: number;
};

export default function PrmContactCounts({
  counts,
}: {
  counts: ContactCount[];
}) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const ytdCounts = counts.filter((c) => c.year === currentYear);
  const ytdTotal = ytdCounts.reduce((sum, c) => sum + c.contactCount, 0);

  // Separate current partial month from complete months
  const partialMonth = counts.find(
    (c) => c.year === currentYear && c.month === currentMonth,
  );
  const completeCounts = counts.filter(
    (c) => !(c.year === currentYear && c.month === currentMonth),
  );

  // The 6 most recent complete months
  const completeSorted = [...completeCounts].sort(
    (a, b) => b.year - a.year || b.month - a.month,
  );
  const recentSix = completeSorted.slice(0, 6).sort(
    (a, b) => a.year - b.year || a.month - b.month,
  );

  // Build a lookup for prior-year values
  const countLookup = new Map(
    counts.map((c) => [`${c.year}-${c.month}`, c]),
  );

  // For each complete display month, find the same month from prior year
  const displayData = recentSix.map((c) => {
    const priorYear = countLookup.get(`${c.year - 1}-${c.month}`);
    return {
      current: c,
      priorYear: priorYear ?? null,
    };
  });

  const hasPriorYear = displayData.some((d) => d.priorYear !== null);

  // Total bar count for viewBox sizing (6 complete + optional partial)
  const totalBars = displayData.length + (partialMonth ? 1 : 0);

  // Max across complete months, prior year, and partial month for bar scaling
  const allValues = [
    ...displayData.flatMap((d) => [
      d.current.contactCount,
      d.priorYear?.contactCount ?? 0,
    ]),
    partialMonth?.contactCount ?? 0,
  ];
  const maxCount = Math.max(...allValues, 1);

  const latestComplete = recentSix.length > 0 ? recentSix[recentSix.length - 1] : null;
  const latestMonth = partialMonth ?? latestComplete;

  // Build linear regression trend line across the 6 complete months only
  const trendPath = (() => {
    if (displayData.length < 2) return '';
    const n = displayData.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < n; i++) {
      const y = displayData[i].current.contactCount;
      sumX += i;
      sumY += y;
      sumXY += i * y;
      sumXX += i * i;
    }
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const startY = 100 - (intercept / maxCount) * 100;
    const endY = 100 - ((slope * (n - 1) + intercept) / maxCount) * 100;
    // Trend line spans only the complete months portion of the viewBox
    const startX = 0.5 * 100;
    const endX = (n - 0.5) * 100;
    return `M ${startX} ${startY} L ${endX} ${endY}`;
  })();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8 overflow-hidden">
      {counts.length === 0 ? (
        <div className="p-6">
          <p className="text-sm text-gray-500">No contact data synced yet.</p>
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 divide-x divide-gray-100 border-b border-gray-100">
            <div className="p-5 text-center">
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">YTD Total</p>
              <p className="text-3xl font-bold text-brand-navy leading-tight">{ytdTotal}</p>
            </div>
            <div className="p-5 text-center">
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">Latest Month</p>
              <p className="text-3xl font-bold text-brand-navy leading-tight">
                {latestMonth?.contactCount ?? '—'}
              </p>
              {latestMonth && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {SHORT_MONTHS[latestMonth.month - 1]} {latestMonth.year}
                </p>
              )}
            </div>
          </div>

          {/* Bar chart */}
          <div className="px-6 pt-5 pb-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                New Contacts by Month
              </p>
              <div className="flex items-center gap-3">
                <span className="relative group flex items-center gap-1.5 text-[11px] text-gray-500 font-medium cursor-help">
                  <span className="inline-block w-2.5 h-2.5 rounded-sm bg-brand-navy" />
                  Last 6 months
                  <span className="absolute bottom-full right-0 mb-2 w-52 p-2 rounded-lg bg-gray-900 text-white text-[11px] leading-relaxed shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-10">
                    Shows the total number of contacts added into the PRM in each of the last 6 complete months.
                  </span>
                </span>
                {hasPriorYear && (
                  <span className="relative group flex items-center gap-1.5 text-[11px] text-gray-400 cursor-help">
                    <span className="inline-block w-2.5 h-2.5 rounded-sm bg-brand-blue/40" />
                    Vs last year
                    <span className="absolute bottom-full right-0 mb-2 w-52 p-2 rounded-lg bg-gray-900 text-white text-[11px] leading-relaxed shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-10">
                      Shows the number of contacts added in the same month in the previous year.
                    </span>
                  </span>
                )}
                <span className="relative group flex items-center gap-1.5 text-[11px] text-gray-500 font-medium cursor-help">
                  <span className="inline-block w-3 h-0.5 rounded" style={{ backgroundColor: '#F4D9B2' }} />
                  Trend
                  <span className="absolute bottom-full right-0 mb-2 w-48 p-2 rounded-lg bg-gray-900 text-white text-[11px] leading-relaxed shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-10">
                    PRM contact trend over the last 6 complete months.
                  </span>
                </span>
              </div>
            </div>
            <div className="relative" style={{ height: 200 }}>
              {/* Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="border-b border-gray-100" />
                ))}
              </div>

              {/* Trend line overlay — spans complete months only */}
              {trendPath && (
                <svg
                  className="absolute inset-0 pointer-events-none"
                  style={{ width: '100%', height: '100%' }}
                  preserveAspectRatio="none"
                  viewBox={`0 0 ${totalBars * 100} 100`}
                >
                  <path
                    fill="none"
                    stroke="#F4D9B2"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                    d={trendPath}
                  />
                </svg>
              )}

              {/* Bars */}
              <div className="relative flex items-end gap-5 sm:gap-7 h-full">
                {/* Complete months */}
                {displayData.map(({ current: c, priorYear: py }) => {
                  const currentPct = (c.contactCount / maxCount) * 100;
                  const priorPct = py ? (py.contactCount / maxCount) * 100 : 0;
                  return (
                    <div
                      key={c.id}
                      className="flex-1 flex flex-col items-center justify-end h-full min-w-0 group"
                    >
                      <div className="w-full h-full flex justify-center items-end gap-0.5">
                        {py && (
                          <div
                            className="flex-1 bg-brand-blue/40 rounded-t-md transition-all duration-200 cursor-default group-hover:bg-brand-blue/50 flex items-end justify-center overflow-hidden"
                            style={{
                              height: priorPct > 0 ? `${priorPct}%` : '0%',
                              minHeight: py.contactCount > 0 ? 20 : 0,
                            }}
                          >
                            <span className="text-[10px] font-medium text-brand-navy/45 pb-1 leading-none">
                              {py.contactCount}
                            </span>
                          </div>
                        )}
                        <div
                          className="flex-1 rounded-t-md transition-all duration-200 cursor-default bg-brand-navy group-hover:bg-brand-navy/85 flex items-end justify-center overflow-hidden"
                          style={{
                            height: currentPct > 0 ? `${currentPct}%` : '0%',
                            minHeight: c.contactCount > 0 ? 20 : 0,
                          }}
                        >
                          <span className="text-[11px] font-bold text-white pb-1 leading-none drop-shadow-sm">
                            {c.contactCount}
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] font-medium text-gray-400 mt-2">
                        {SHORT_MONTHS[c.month - 1]}
                      </span>
                    </div>
                  );
                })}

                {/* Current partial month — separate, with dashed border */}
                {partialMonth && (
                  <div className="flex-1 flex flex-col items-center justify-end h-full min-w-0 group border-l border-dashed border-gray-200 pl-5 sm:pl-7">
                    <div className="w-full h-full flex justify-center items-end">
                      <div
                        className="flex-1 rounded-t-md transition-all duration-200 cursor-default bg-brand-navy/60 group-hover:bg-brand-navy/70 flex items-end justify-center overflow-hidden"
                        style={{
                          height: partialMonth.contactCount > 0 ? `${(partialMonth.contactCount / maxCount) * 100}%` : '0%',
                          minHeight: partialMonth.contactCount > 0 ? 20 : 0,
                        }}
                      >
                        <span className="text-[11px] font-bold text-white pb-1 leading-none drop-shadow-sm">
                          {partialMonth.contactCount}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-medium text-gray-400 mt-2">
                      {SHORT_MONTHS[partialMonth.month - 1]}*
                    </span>
                  </div>
                )}
              </div>
            </div>
            {partialMonth && (
              <p className="text-[10px] text-gray-400 mt-2 text-right">* Current month (in progress)</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
