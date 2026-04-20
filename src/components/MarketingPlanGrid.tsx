const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/** Map known activity labels to distinct pill colors */
const LABEL_COLORS: Record<string, string> = {
  'Blog Post':          'bg-sky-100 text-sky-800',
  'Lead Promo':         'bg-violet-100 text-violet-800',
  'Newsletter':         'bg-emerald-100 text-emerald-800',
  'CPD Event':          'bg-pink-100 text-pink-800',
  'Letterbox Drop':     'bg-orange-100 text-orange-800',
  'Local Initiative':   'bg-teal-100 text-teal-800',
  'GDP Visit':          'bg-indigo-100 text-indigo-800',
  'Community Event':    'bg-rose-100 text-rose-800',
  'Summer Holidays':    'bg-yellow-100 text-yellow-800',
  'Easter Break':       'bg-lime-100 text-lime-800',
  'Winter Break':       'bg-cyan-100 text-cyan-800',
  'Spring Break':       'bg-fuchsia-100 text-fuchsia-800',
};
const DEFAULT_PILL = 'bg-gray-100 text-gray-700';

function getPillColor(label: string): string {
  return LABEL_COLORS[label] ?? DEFAULT_PILL;
}

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
/** Channels that should always be classified as Practice-managed */
const PRACTICE_CHANNELS = new Set([
  'social media',
  'google my business',
  'crm - email',
]);

function getChannelOwnership(channel: Channel): 'TIO' | 'PRACTICE' | null {
  // Explicit overrides by channel name
  if (PRACTICE_CHANNELS.has(channel.name.toLowerCase())) return 'PRACTICE';

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
    if (text.includes('practice')) return 'PRACTICE';
    return 'TIO';
  }
  return null;
}

function getRowColors(ownership: 'TIO' | 'PRACTICE' | null) {
  if (ownership === 'TIO') {
    return { bg: 'bg-brand-green/30', channelBg: 'bg-brand-green/60', border: 'border-b border-brand-green' };
  }
  if (ownership === 'PRACTICE') {
    return { bg: 'bg-brand-blue/30', channelBg: 'bg-brand-blue/60', border: 'border-b border-brand-blue' };
  }
  return { bg: 'bg-white', channelBg: 'bg-gray-100', border: 'border-b border-gray-100' };
}

export default function MarketingPlanGrid({ plan }: { plan: MarketingPlan }) {
  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full border-collapse min-w-[800px]">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-brand-navy text-white text-xs font-semibold px-4 py-3 text-left min-w-[160px] border-r border-white/20">
                Channel
              </th>
              {MONTHS.map((m, i) => (
                <th
                  key={m}
                  className={`bg-brand-navy text-white text-xs font-semibold px-2 py-3 text-center min-w-[80px]${i < 11 ? ' border-r border-white/20' : ''}`}
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
                    <td className={`sticky left-0 z-10 ${colors.channelBg} px-4 py-3 text-sm font-semibold text-brand-navy ${colors.border} border-r border-gray-200`}>
                      {channel.name}
                    </td>
                    <td
                      colSpan={12}
                      className={`px-4 py-3 text-sm italic text-gray-500 text-center ${colors.border}`}
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
                  <td className={`sticky left-0 z-10 ${colors.channelBg} px-4 py-3 text-sm font-semibold text-brand-navy ${colors.border} border-r border-gray-200`}>
                    {channel.name}
                  </td>
                  {MONTHS.map((_, mIdx) => {
                    const month = mIdx + 1;
                    const activities = byMonth[month] ?? [];
                    return (
                      <td
                        key={month}
                        className={`px-1 py-2 text-center ${colors.border} align-top${mIdx < 11 ? ' border-r border-gray-100' : ''}`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          {activities.map((a) => (
                            <span
                              key={a.id}
                              className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium leading-tight ${getPillColor(a.label)}`}
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
          <span className="inline-block w-3 h-3 rounded bg-brand-green border border-brand-green" />
          Managed by TIO
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-brand-blue border border-brand-blue" />
          Managed by Practice (with TIO support)
        </span>
      </div>
    </div>
  );
}
