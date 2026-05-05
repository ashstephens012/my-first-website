'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { FUNNEL_STAGE_LABELS } from '@/types/performance-report';
import type { FunnelData } from '@/types/performance-report';

const STAGE_COLORS = [
  '#192845', // Lead — navy
  '#bce1eb', // Consult Booked — brand blue
  '#cedad6', // Consult Attended — brand green
  '#4ade80', // TX Started — green
  '#fad8ad', // TX Not Started — brand orange
];

interface FunnelChartProps {
  data: FunnelData;
}

export default function FunnelChart({ data }: FunnelChartProps) {
  const chartData = data.map((d, i) => ({
    name: FUNNEL_STAGE_LABELS[d.stage],
    count: d.count,
    fill: STAGE_COLORS[i],
  }));

  return (
    <div className="w-full h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 140, bottom: 5 }}
        >
          <XAxis type="number" allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="name"
            width={130}
            tick={{ fontSize: 12, fill: '#192845' }}
          />
          <Tooltip
            formatter={(value) => [`${value}`, 'Contacts']}
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontSize: '13px',
            }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={32}>
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
