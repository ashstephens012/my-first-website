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
