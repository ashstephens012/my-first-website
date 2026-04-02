"use client";

import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import type { PieLabelRenderProps } from "recharts";

const BRAND = {
  navy: "#192845",
  blue: "#bce1eb",
  green: "#cedad6",
  orange: "#fad8ad",
  pink: "#f8d1c4",
};

const PIE_COLORS = [BRAND.navy, BRAND.blue, BRAND.green, BRAND.orange, BRAND.pink];

type CaseStartsPoint = { month: string; caseStarts: number };
type ReportsPoint = { month: string; draft: number; reviewed: number; sent: number };
type PrmPoint = { month: string; contacts: number };
type RegionPoint = { region: string; count: number };

interface Props {
  caseStartsTrend: CaseStartsPoint[];
  reportsTrend: ReportsPoint[];
  prmTrend: PrmPoint[];
  regionBreakdown: RegionPoint[];
}

function formatMonth(value: string | number): string {
  const m = String(value);
  const [y, mo] = m.split("-");
  const date = new Date(Number(y), Number(mo) - 1);
  return date.toLocaleString("default", { month: "short", year: "2-digit" });
}

// Tooltip labelFormatter expects (label: any, payload) => ReactNode
function tooltipLabelFormatter(label: unknown): string {
  return formatMonth(String(label));
}

export default function LeadershipCharts({
  caseStartsTrend,
  reportsTrend,
  prmTrend,
  regionBreakdown,
}: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Case Starts by Month */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h3 className="text-lg font-semibold text-brand-navy mb-4">Case Starts by Month</h3>
        {caseStartsTrend.length === 0 ? (
          <p className="text-sm text-gray-400 py-12 text-center">No data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={caseStartsTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tickFormatter={formatMonth} fontSize={12} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip labelFormatter={tooltipLabelFormatter} />
              <Bar dataKey="caseStarts" name="Case Starts" fill={BRAND.navy} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Reports by Month */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h3 className="text-lg font-semibold text-brand-navy mb-4">Reports by Month</h3>
        {reportsTrend.length === 0 ? (
          <p className="text-sm text-gray-400 py-12 text-center">No data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportsTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tickFormatter={formatMonth} fontSize={12} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip labelFormatter={tooltipLabelFormatter} />
              <Legend />
              <Bar dataKey="sent" name="Sent" stackId="a" fill={BRAND.green} radius={[0, 0, 0, 0]} />
              <Bar dataKey="reviewed" name="Reviewed" stackId="a" fill={BRAND.blue} radius={[0, 0, 0, 0]} />
              <Bar dataKey="draft" name="Draft" stackId="a" fill={BRAND.orange} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* PRM Contacts by Month */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h3 className="text-lg font-semibold text-brand-navy mb-4">PRM Contacts by Month</h3>
        {prmTrend.length === 0 ? (
          <p className="text-sm text-gray-400 py-12 text-center">No data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={prmTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tickFormatter={formatMonth} fontSize={12} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip labelFormatter={tooltipLabelFormatter} />
              <Line type="monotone" dataKey="contacts" name="Contacts" stroke={BRAND.navy} strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Members by Region */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h3 className="text-lg font-semibold text-brand-navy mb-4">Members by Region</h3>
        {regionBreakdown.length === 0 ? (
          <p className="text-sm text-gray-400 py-12 text-center">No data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={regionBreakdown}
                dataKey="count"
                nameKey="region"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(props: PieLabelRenderProps & { region?: string; count?: number }) => `${props.region ?? ''}: ${props.count ?? 0}`}
              >
                {regionBreakdown.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
