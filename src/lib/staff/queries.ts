/**
 * Staff (Consultant / Digital Strategist) member queries.
 * Matches session user name against consultantName / digitalStrategistName
 * on the Member model — no new roles or schema changes required.
 *
 * Initialisation is split by role:
 *   Consultant:          case-starts target set, monthly submissions exist,
 *                        and 'Consulting' deliverables created for the year.
 *   Digital Strategist:  'Digital Strategy' deliverables created for the year.
 */

import prisma from '@/lib/prisma';
import type { Member } from '@prisma/client';

export type StaffRelation = 'consultant' | 'strategist' | 'both';

export type StaffMember = Member & {
  _count?: { reports: number };
  consultantInitialised: boolean;
  strategistInitialised: boolean;
  /** What the consultant side is missing (empty array if initialised) */
  consultantMissing: string[];
  /** What the strategist side is missing (empty array if initialised) */
  strategistMissing: string[];
  staffRelation: StaffRelation;
};

export interface StaffMembersResult {
  members: StaffMember[];
  staffRole: 'consultant' | 'strategist' | 'both' | null;
}

/**
 * Fetch members assigned to a staff user (by name match).
 * Returns an empty list when the name doesn't match any member's
 * consultantName or digitalStrategistName.
 */
export async function getStaffMembers(userName: string | null | undefined): Promise<StaffMembersResult> {
  if (!userName) return { members: [], staffRole: null };

  const nameLower = userName.toLowerCase();
  const currentYear = new Date().getFullYear();

  const members = await prisma.member.findMany({
    where: {
      OR: [
        { consultantName: { equals: userName, mode: 'insensitive' } },
        { digitalStrategistName: { equals: userName, mode: 'insensitive' } },
      ],
    },
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { reports: true } },
      deliverables: {
        where: { year: currentYear },
        select: { id: true, category: true },
      },
      caseStartSubmissions: {
        where: { year: currentYear },
        take: 1,
        select: { id: true },
      },
    },
  });

  if (members.length === 0) return { members: [], staffRole: null };

  let isConsultant = false;
  let isStrategist = false;

  const staffMembers: StaffMember[] = members.map(
    ({ deliverables, caseStartSubmissions, ...rest }) => {
      const matchesConsultant = rest.consultantName?.toLowerCase() === nameLower;
      const matchesStrategist = rest.digitalStrategistName?.toLowerCase() === nameLower;

      if (matchesConsultant) isConsultant = true;
      if (matchesStrategist) isStrategist = true;

      const staffRelation: StaffRelation =
        matchesConsultant && matchesStrategist ? 'both' :
        matchesConsultant ? 'consultant' : 'strategist';

      // Consultant initialisation checks
      const hasTarget = !!rest.annualCaseStartsTarget;
      const hasCaseStarts = caseStartSubmissions.length > 0;
      const hasConsultingDeliverables = deliverables.some(
        (d) => d.category === 'Consulting',
      );
      const consultantMissing: string[] = [];
      if (!hasTarget) consultantMissing.push('case-starts target');
      if (!hasCaseStarts) consultantMissing.push('monthly case starts');
      if (!hasConsultingDeliverables) consultantMissing.push('Consulting deliverables');
      const consultantInitialised = consultantMissing.length === 0;

      // Digital Strategist initialisation checks
      const hasStrategyDeliverables = deliverables.some(
        (d) => d.category === 'Digital Strategy',
      );
      const strategistMissing: string[] = [];
      if (!hasStrategyDeliverables) strategistMissing.push('Digital Strategy deliverables');
      const strategistInitialised = strategistMissing.length === 0;

      return {
        ...rest,
        consultantInitialised,
        strategistInitialised,
        consultantMissing,
        strategistMissing,
        staffRelation,
      };
    },
  );

  const staffRole: StaffMembersResult['staffRole'] =
    isConsultant && isStrategist ? 'both' :
    isConsultant ? 'consultant' : 'strategist';

  return { members: staffMembers, staffRole };
}

/* ------------------------------------------------------------------ */
/*  Member Management — richer query for /dashboard/member-management  */
/* ------------------------------------------------------------------ */

export interface OutstandingItem {
  type: string;
  severity: 'critical' | 'warning' | 'info';
  label: string;
  detail?: string;
}

export type MemberManagementRow = Member & {
  _count: { reports: number };
  staffRelation: StaffRelation;
  caseStartSubmissions: { id: string; month: number; caseStarts: number }[];
  deliverables: {
    id: string;
    category: string;
    name: string;
    annualAllocation: number;
    plannedMonth: number | null;
    plannedMonths: number[];
    completions: { id: string; completedAt: Date }[];
  }[];
  quarterlyFocuses: { id: string; quarter: number; focus: string }[];
  outstandingItems: OutstandingItem[];
  outstandingCount: number;
};

export interface StaffMemberManagementResult {
  members: MemberManagementRow[];
  staffRole: 'consultant' | 'strategist' | 'both' | null;
  currentMonth: number;
  currentYear: number;
}

/**
 * Fetch richer member data for the Member Management page.
 * Computes outstanding items per member server-side.
 */
export async function getStaffMemberManagement(
  userName: string | null | undefined,
): Promise<StaffMemberManagementResult> {
  if (!userName) return { members: [], staffRole: null, currentMonth: 0, currentYear: 0 };

  const nameLower = userName.toLowerCase();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-based
  const currentQuarter = Math.ceil(currentMonth / 3);

  const members = await prisma.member.findMany({
    where: {
      OR: [
        { consultantName: { equals: userName, mode: 'insensitive' } },
        { digitalStrategistName: { equals: userName, mode: 'insensitive' } },
      ],
    },
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { reports: true } },
      caseStartSubmissions: {
        where: { year: currentYear },
        select: { id: true, month: true, caseStarts: true },
      },
      deliverables: {
        where: { year: currentYear },
        select: {
          id: true,
          category: true,
          name: true,
          annualAllocation: true,
          plannedMonth: true,
          plannedMonths: true,
          completions: {
            select: { id: true, completedAt: true },
          },
        },
      },
      quarterlyFocuses: {
        where: { year: currentYear },
        select: { id: true, quarter: true, focus: true },
      },
    },
  });

  if (members.length === 0) {
    return { members: [], staffRole: null, currentMonth, currentYear };
  }

  let isConsultant = false;
  let isStrategist = false;

  const managementRows: MemberManagementRow[] = members.map(
    ({ deliverables, caseStartSubmissions, quarterlyFocuses, ...rest }) => {
      const matchesConsultant = rest.consultantName?.toLowerCase() === nameLower;
      const matchesStrategist = rest.digitalStrategistName?.toLowerCase() === nameLower;

      if (matchesConsultant) isConsultant = true;
      if (matchesStrategist) isStrategist = true;

      const staffRelation: StaffRelation =
        matchesConsultant && matchesStrategist ? 'both' :
        matchesConsultant ? 'consultant' : 'strategist';

      // --- Compute outstanding items ---
      const outstandingItems: OutstandingItem[] = [];
      const isConsultantRelation = staffRelation === 'consultant' || staffRelation === 'both';
      const isStrategistRelation = staffRelation === 'strategist' || staffRelation === 'both';

      // Consultant-relevant checks
      if (isConsultantRelation) {
        // Missing case starts for past months
        const submittedMonths = new Set(caseStartSubmissions.map((s) => s.month));
        const missingMonths: number[] = [];
        for (let m = 1; m < currentMonth; m++) {
          if (!submittedMonths.has(m)) missingMonths.push(m);
        }
        if (missingMonths.length > 0) {
          const monthNames = missingMonths.map((m) =>
            new Date(currentYear, m - 1).toLocaleString('default', { month: 'short' }),
          );
          outstandingItems.push({
            type: 'missing_case_starts',
            severity: 'critical',
            label: `Missing case starts for ${missingMonths.length} month${missingMonths.length > 1 ? 's' : ''}`,
            detail: monthNames.join(', '),
          });
        }

        // Missing annual target
        if (!rest.annualCaseStartsTarget) {
          outstandingItems.push({
            type: 'missing_annual_target',
            severity: 'warning',
            label: 'Missing annual case starts target',
          });
        }

        // Missing Consulting deliverables
        if (!deliverables.some((d) => d.category === 'Consulting')) {
          outstandingItems.push({
            type: 'missing_consulting_deliverables',
            severity: 'warning',
            label: 'No Consulting deliverables set up',
          });
        }
      }

      // Strategist-relevant checks
      if (isStrategistRelation) {
        if (!deliverables.some((d) => d.category === 'Digital Strategy')) {
          outstandingItems.push({
            type: 'missing_strategy_deliverables',
            severity: 'warning',
            label: 'No Digital Strategy deliverables set up',
          });
        }
      }

      // Overdue deliverables (category-dependent)
      for (const d of deliverables) {
        const isCategoryRelevant =
          (d.category === 'Consulting' && isConsultantRelation) ||
          (d.category === 'Digital Strategy' && isStrategistRelation);
        if (!isCategoryRelevant) continue;

        // Check each planned month in the past
        const months = d.plannedMonths.length > 0
          ? d.plannedMonths
          : d.plannedMonth ? [d.plannedMonth] : [];

        const pastPlannedMonths = months.filter((m) => m < currentMonth);
        if (pastPlannedMonths.length > 0 && d.completions.length < d.annualAllocation) {
          outstandingItems.push({
            type: 'overdue_deliverable',
            severity: 'warning',
            label: `Overdue: ${d.name}`,
            detail: `${d.completions.length}/${d.annualAllocation} completed`,
          });
        }
      }

      // Missing quarterly focus (both roles)
      if (isConsultantRelation || isStrategistRelation) {
        if (!quarterlyFocuses.some((qf) => qf.quarter === currentQuarter)) {
          outstandingItems.push({
            type: 'missing_quarterly_focus',
            severity: 'info',
            label: `No Q${currentQuarter} focus set`,
          });
        }
      }

      return {
        ...rest,
        staffRelation,
        caseStartSubmissions,
        deliverables,
        quarterlyFocuses,
        outstandingItems,
        outstandingCount: outstandingItems.length,
      };
    },
  );

  const staffRole: StaffMemberManagementResult['staffRole'] =
    isConsultant && isStrategist ? 'both' :
    isConsultant ? 'consultant' : 'strategist';

  return { members: managementRows, staffRole, currentMonth, currentYear };
}
