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
            {plan.channels.map((channel, idx) => {
              const rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-gray-50';

              if (channel.alwaysOn) {
                return (
                  <tr key={channel.id} className={rowBg}>
                    <td className={`sticky left-0 z-10 ${rowBg} px-4 py-3 text-sm font-semibold text-brand-navy border-b border-gray-100`}>
                      {channel.name}
                    </td>
                    <td
                      colSpan={12}
                      className="px-4 py-3 text-sm italic text-gray-500 border-b border-gray-100"
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
                <tr key={channel.id} className={rowBg}>
                  <td className={`sticky left-0 z-10 ${rowBg} px-4 py-3 text-sm font-semibold text-brand-navy border-b border-gray-100`}>
                    {channel.name}
                  </td>
                  {MONTHS.map((_, mIdx) => {
                    const month = mIdx + 1;
                    const activities = byMonth[month] ?? [];
                    return (
                      <td
                        key={month}
                        className="px-1 py-2 text-center border-b border-gray-100 align-top"
                      >
                        <div className="flex flex-col items-center gap-1">
                          {activities.map((a) => (
                            <span
                              key={a.id}
                              className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium leading-tight ${
                                a.ownership === 'TIO'
                                  ? 'bg-red-100 text-red-900'
                                  : 'bg-amber-100 text-amber-900'
                              }`}
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
          <span className="inline-block w-3 h-3 rounded-full bg-red-100 border border-red-200" />
          Managed by TIO
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-amber-100 border border-amber-200" />
          Managed by Practice (with TIO support)
        </span>
      </div>
    </div>
  );
}
