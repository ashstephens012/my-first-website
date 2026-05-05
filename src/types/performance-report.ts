/**
 * Performance Report Types
 * Shared types for the practice performance reporting feature
 */

export const FUNNEL_STAGES = [
  'LEAD',
  'CONSULT_BOOKED',
  'CONSULT_ATTENDED',
  'TX_STARTED',
  'TX_NOT_STARTED',
] as const;

export type FunnelStage = (typeof FUNNEL_STAGES)[number];

export const FUNNEL_STAGE_LABELS: Record<FunnelStage, string> = {
  LEAD: 'Lead',
  CONSULT_BOOKED: 'Consultation Booked',
  CONSULT_ATTENDED: 'Consultation Attended',
  TX_STARTED: 'Treatment Started',
  TX_NOT_STARTED: 'Treatment Not Started',
};

export interface FunnelStageData {
  stage: FunnelStage;
  count: number;
  prmCategoryIds: string[];
}

export type FunnelData = FunnelStageData[];

export interface RoiData {
  pipelineValue: number;
  actualRevenue: number;
  potentialLostRevenue: number;
  averageOrderValue: number;
}

export interface ConversionRates {
  leadToBooking: number | null;
  bookingToAttendance: number | null;
  attendanceToStart: number | null;
  overallLeadToStart: number | null;
}

export interface PrmCategory {
  categoryid: string;
  categoryname: string;
}

export interface PrmContact {
  contactid: string;
  firstname: string;
  lastname: string;
  adddate: string;
  categories?: { category?: PrmCategory[] | PrmCategory };
}
