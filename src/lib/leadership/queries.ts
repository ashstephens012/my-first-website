import { prisma } from '../prisma';

/* ── Types ──────────────────────────────────────────────────── */

export type RegionOverview = {
  region: string;
  activeMembers: number;
  totalMembers: number;
  totalReports: number;
  sentReports: number;
  draftReports: number;
  reviewedReports: number;
  ytdCaseStarts: number;
  ytdPrmContacts: number;
};

export type RegionCaseStartsPoint = {
  month: string;
  region: string;
  caseStarts: number;
};

export type RegionReportsPoint = {
  month: string;
  region: string;
  draft: number;
  reviewed: number;
  sent: number;
};

export type RegionPrmPoint = {
  month: string;
  region: string;
  contacts: number;
};

/* ── Helpers ────────────────────────────────────────────────── */

const regionOf = (r: string | null) => r ?? 'Unknown';

/* ── Overview by region ─────────────────────────────────────── */

export async function getLeadershipOverviewByRegion(): Promise<RegionOverview[]> {
  const now = new Date();

  const [members, reports, caseStarts, prmContacts] = await Promise.all([
    prisma.member.findMany({ select: { region: true, status: true } }),
    prisma.report.findMany({
      select: { status: true, member: { select: { region: true } } },
    }),
    prisma.caseStartSubmission.findMany({
      where: { year: now.getFullYear() },
      select: { caseStarts: true, member: { select: { region: true } } },
    }),
    prisma.prmContactCount.findMany({
      where: { year: now.getFullYear() },
      select: { contactCount: true, member: { select: { region: true } } },
    }),
  ]);

  const map = new Map<string, RegionOverview>();
  const ensure = (region: string): RegionOverview => {
    if (!map.has(region)) {
      map.set(region, {
        region,
        activeMembers: 0,
        totalMembers: 0,
        totalReports: 0,
        sentReports: 0,
        draftReports: 0,
        reviewedReports: 0,
        ytdCaseStarts: 0,
        ytdPrmContacts: 0,
      });
    }
    return map.get(region)!;
  };

  for (const m of members) {
    const e = ensure(regionOf(m.region));
    e.totalMembers++;
    if (m.status === 'active') e.activeMembers++;
  }
  for (const r of reports) {
    const e = ensure(regionOf(r.member.region));
    e.totalReports++;
    if (r.status === 'sent') e.sentReports++;
    else if (r.status === 'draft') e.draftReports++;
    else if (r.status === 'reviewed') e.reviewedReports++;
  }
  for (const cs of caseStarts) {
    ensure(regionOf(cs.member.region)).ytdCaseStarts += cs.caseStarts;
  }
  for (const pc of prmContacts) {
    ensure(regionOf(pc.member.region)).ytdPrmContacts += pc.contactCount;
  }

  return Array.from(map.values()).sort((a, b) => a.region.localeCompare(b.region));
}

/* ── Monthly case starts by region ──────────────────────────── */

export async function getMonthlyCaseStartsTrend(): Promise<RegionCaseStartsPoint[]> {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 11);
  const startYear = cutoff.getFullYear();
  const startMonth = cutoff.getMonth() + 1;

  const rows = await prisma.caseStartSubmission.findMany({
    where: {
      OR: [
        { year: { gt: startYear } },
        { year: startYear, month: { gte: startMonth } },
      ],
    },
    select: {
      year: true,
      month: true,
      caseStarts: true,
      member: { select: { region: true } },
    },
  });

  const grouped = new Map<string, number>();
  for (const r of rows) {
    const region = regionOf(r.member.region);
    const key = `${r.year}-${String(r.month).padStart(2, '0')}|${region}`;
    grouped.set(key, (grouped.get(key) ?? 0) + r.caseStarts);
  }

  return Array.from(grouped.entries())
    .map(([key, caseStarts]) => {
      const [month, region] = key.split('|');
      return { month, region, caseStarts };
    })
    .sort((a, b) => a.month.localeCompare(b.month) || a.region.localeCompare(b.region));
}

/* ── Monthly reports by region ──────────────────────────────── */

export async function getMonthlyReportsTrend(): Promise<RegionReportsPoint[]> {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 11);
  const startDate = new Date(cutoff.getFullYear(), cutoff.getMonth(), 1);

  const reports = await prisma.report.findMany({
    where: { reportMonth: { gte: startDate } },
    select: {
      reportMonth: true,
      status: true,
      member: { select: { region: true } },
    },
  });

  const grouped = new Map<string, { draft: number; reviewed: number; sent: number }>();
  for (const r of reports) {
    const region = regionOf(r.member.region);
    const key = `${r.reportMonth.getFullYear()}-${String(r.reportMonth.getMonth() + 1).padStart(2, '0')}|${region}`;
    if (!grouped.has(key)) grouped.set(key, { draft: 0, reviewed: 0, sent: 0 });
    const entry = grouped.get(key)!;
    if (r.status === 'draft') entry.draft++;
    else if (r.status === 'reviewed') entry.reviewed++;
    else if (r.status === 'sent') entry.sent++;
  }

  return Array.from(grouped.entries())
    .map(([key, counts]) => {
      const [month, region] = key.split('|');
      return { month, region, ...counts };
    })
    .sort((a, b) => a.month.localeCompare(b.month) || a.region.localeCompare(b.region));
}

/* ── Monthly PRM contacts by region ─────────────────────────── */

export async function getMonthlyPrmTrend(): Promise<RegionPrmPoint[]> {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 11);
  const startYear = cutoff.getFullYear();
  const startMonth = cutoff.getMonth() + 1;

  const rows = await prisma.prmContactCount.findMany({
    where: {
      OR: [
        { year: { gt: startYear } },
        { year: startYear, month: { gte: startMonth } },
      ],
    },
    select: {
      year: true,
      month: true,
      contactCount: true,
      member: { select: { region: true } },
    },
  });

  const grouped = new Map<string, number>();
  for (const r of rows) {
    const region = regionOf(r.member.region);
    const key = `${r.year}-${String(r.month).padStart(2, '0')}|${region}`;
    grouped.set(key, (grouped.get(key) ?? 0) + r.contactCount);
  }

  return Array.from(grouped.entries())
    .map(([key, contacts]) => {
      const [month, region] = key.split('|');
      return { month, region, contacts };
    })
    .sort((a, b) => a.month.localeCompare(b.month) || a.region.localeCompare(b.region));
}

/* ── Region breakdown (for pie chart) ───────────────────────── */

export async function getRegionBreakdown() {
  const rows = await prisma.member.groupBy({
    by: ['region'],
    _count: { id: true },
    where: { status: 'active' },
  });

  return rows.map((r) => ({
    region: r.region ?? 'Unknown',
    count: r._count.id,
  }));
}
