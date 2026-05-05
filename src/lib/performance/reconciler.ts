/**
 * TC Tracker / PRM Reconciler
 * Compares PRM funnel data with TC Tracker data to surface discrepancies.
 */

import type { TcTrackerRecord } from '@/lib/google-sheets';
import type { FunnelStage } from '@/types/performance-report';
import { FUNNEL_STAGE_LABELS } from '@/types/performance-report';

export interface Discrepancy {
  patientName: string;
  prmStage: string | null;
  tcTrackerStatus: string;
}

interface PrmContactSummary {
  name: string;
  stage: FunnelStage | null;
}

/**
 * Compare PRM contacts with TC Tracker records for the same period.
 * Matches by normalised name and flags mismatches.
 */
export function reconcile(
  prmContacts: PrmContactSummary[],
  tcRecords: TcTrackerRecord[],
): Discrepancy[] {
  const discrepancies: Discrepancy[] = [];

  // Build a lookup of PRM contacts by normalised name
  const prmByName = new Map<string, PrmContactSummary>();
  for (const c of prmContacts) {
    prmByName.set(normaliseName(c.name), c);
  }

  for (const tc of tcRecords) {
    const key = normaliseName(tc.patientName);
    const prm = prmByName.get(key);

    if (!prm) {
      // In TC Tracker but not in PRM for this period
      discrepancies.push({
        patientName: tc.patientName,
        prmStage: null,
        tcTrackerStatus: tc.status,
      });
      continue;
    }

    // Compare stages — only flag if PRM has a stage and they differ meaningfully
    if (prm.stage) {
      const prmLabel = FUNNEL_STAGE_LABELS[prm.stage].toLowerCase();
      const tcStatus = tc.status.toLowerCase();
      if (!tcStatus.includes(prmLabel) && !prmLabel.includes(tcStatus)) {
        discrepancies.push({
          patientName: tc.patientName,
          prmStage: FUNNEL_STAGE_LABELS[prm.stage],
          tcTrackerStatus: tc.status,
        });
      }
    }
  }

  return discrepancies;
}

function normaliseName(name: string): string {
  return name.toLowerCase().replace(/[^a-z]/g, '');
}
