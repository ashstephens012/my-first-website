const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

type Activity = {
  id: string;
  month: number;
  label: string;
  ownership: string;
  sortOrder: number;
};

type Channel = {
  id: string;
  name: string;
  alwaysOn: boolean;
  description: string | null;
  sortOrder: number;
  activities: Activity[];
};

type MarketingPlan = {
  id: string;
  year: number;
  channels: Channel[];
};

/**
 * Determine the dominant ownership for a channel row.
 * If all activities share the same owner, use that.
 * For always-on channels with no activities, infer from the description/name.
 */
function getChannelOwnership(channel: Channel): 'TIO' | 'PRACTICE' | null {
  if (channel.activities.length > 0) {
    const owners = new Set(channel.activities.map((a) => a.ownership));
    if (owners.size === 1) return channel.activities[0].ownership as 'TIO' | 'PRACTICE';
    // Mixed — count majority
    const tioCount = channel.activities.filter((a) => a.ownership === 'TIO').length;
    return tioCount >= channel.activities.length / 2 ? 'TIO' : 'PRACTICE';
  }
  // Always-on with no activities — infer from name/description
  if (channel.alwaysOn) {
    const text = `${channel.name} ${channel.description ?? ''}`.toLowerCase();
    if (text.includes('practice') || text.includes('social media')) return 'PRACTICE';
    return 'TIO';
  }
  return null;
}

function getRowColors(ownership: 'TIO' | 'PRACTICE' | null) {
  if (ownership === 'TIO') {
    return { bg: 'bg-red-50', stickyBg: 'bg-red-50', border: 'border-b border-red-100' };
  }
  if (ownership === 'PRACTICE') {
    return { bg: 'bg-amber-50', stickyBg: 'bg-amber-50', border: 'border-b border-amber-100' };
  }
  return { bg: 'bg-white', stickyBg: 'bg-white', border: 'border-b border-gray-100' };
}

export default function MarketingPlanGrid({ plan }: { plan: MarketingPlan }) {
  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full border-collapse min-w-[800px]">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-brand-navy text-white text-xs font-semibold px-4 py-3 text-left min-w-[160px]">
                Channel
              </th>
              {MONTHS.map((m) => (
                <th
                  key={m}
                  className="bg-brand-navy text-white text-xs font-semibold px-2 py-3 text-center min-w-[80px]"
                >
                  {m}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {plan.channels.map((channel) => {
              const ownership = getChannelOwnership(channel);
              const colors = getRowColors(ownership);

              if (channel.alwaysOn) {
                return (
                  <tr key={channel.id} className={colors.bg}>
                    <td className={`sticky left-0 z-10 ${colors.stickyBg} px-4 py-3 text-sm font-semibold text-brand-navy ${colors.border}`}>
                      {channel.name}
                    </td>
                    <td
                      colSpan={12}
                      className={`px-4 py-3 text-sm italic text-gray-500 ${colors.border}`}
                    >
                      Always on {channel.description ? `\u2014 ${channel.description.replace(/^Always on\s*[—–-]?\s*/i, '')}` : ''}
                    </td>
                  </tr>
                );
              }

              // Group activities by month
              const byMonth: Record<number, Activity[]> = {};
              for (const a of channel.activities) {
                if (!byMonth[a.month]) byMonth[a.month] = [];
                byMonth[a.month].push(a);
              }

              return (
                <tr key={channel.id} className={colors.bg}>
                  <td className={`sticky left-0 z-10 ${colors.stickyBg} px-4 py-3 text-sm font-semibold text-brand-navy ${colors.border}`}>
                    {channel.name}
                  </td>
                  {MONTHS.map((_, mIdx) => {
                    const month = mIdx + 1;
                    const activities = byMonth[month] ?? [];
                    return (
                      <td
                        key={month}
                        className={`px-1 py-2 text-center ${colors.border} align-top`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          {activities.map((a) => (
                            <span
                              key={a.id}
                              className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium leading-tight bg-white/70 text-brand-navy"
                            >
                              {a.label}
                            </span>
                          ))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-red-50 border border-red-200" />
          Managed by TIO
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-amber-50 border border-amber-200" />
          Managed by Practice (with TIO support)
        </span>
      </div>
    </div>
  );
}
