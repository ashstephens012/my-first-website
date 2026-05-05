/**
 * Google Sheets Integration
 * Reads TC Tracker spreadsheets shared with the service account.
 */

import { google } from 'googleapis';

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!email || !key) {
    throw new Error('Google service account credentials not configured');
  }

  return new google.auth.JWT({
    email,
    key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
}

export function isGoogleSheetsConfigured(): boolean {
  return !!(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
  );
}

/**
 * List all tab names in a spreadsheet.
 */
export async function getSheetTabs(sheetId: string): Promise<string[]> {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  const res = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
  return (res.data.sheets ?? []).map((s) => s.properties?.title ?? '').filter(Boolean);
}

/**
 * Read all rows from a specific tab.
 */
export async function getTabData(
  sheetId: string,
  tabName: string,
): Promise<string[][]> {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: tabName,
  });

  return (res.data.values ?? []) as string[][];
}

/** Default column mapping for TC Tracker sheets */
export const DEFAULT_TC_COLUMN_MAPPING = {
  patientName: 0,
  status: 1,
  treatmentValue: 2,
  date: 3,
};

export interface TcTrackerRecord {
  patientName: string;
  status: string;
  treatmentValue: number | null;
  date: string;
}

/**
 * Parse raw rows into structured TC Tracker records.
 */
export function parseTcTrackerData(
  rows: string[][],
  columnMapping = DEFAULT_TC_COLUMN_MAPPING,
): TcTrackerRecord[] {
  // Skip header row
  return rows.slice(1).map((row) => ({
    patientName: row[columnMapping.patientName]?.trim() ?? '',
    status: row[columnMapping.status]?.trim() ?? '',
    treatmentValue: row[columnMapping.treatmentValue]
      ? parseFloat(row[columnMapping.treatmentValue].replace(/[^0-9.]/g, '')) || null
      : null,
    date: row[columnMapping.date]?.trim() ?? '',
  })).filter((r) => r.patientName);
}
