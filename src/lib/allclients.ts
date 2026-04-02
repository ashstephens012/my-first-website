/**
 * AllClients PRM API Client
 * Fetches contact counts from the AllClients API for monthly reporting.
 */

const ALLCLIENTS_API_URL = 'https://prm.growdental.com/api/2/GetContacts.aspx';
const PAGE_SIZE = 100;

interface AllClientsResponse {
  results?: {
    error?: string;
    contacts?: {
      contact?: unknown[];
    };
    [key: string]: unknown;
  };
}

/**
 * Format a date as MM/DD/YY HH:MM (US Central Time) for the AllClients API.
 */
function formatDateForApi(date: Date): string {
  const ct = new Date(date.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  const mm = String(ct.getMonth() + 1).padStart(2, '0');
  const dd = String(ct.getDate()).padStart(2, '0');
  const yy = String(ct.getFullYear()).slice(-2);
  return `${mm}/${dd}/${yy} 00:00`;
}

/**
 * Count all contacts added after a given date by paginating through the API.
 */
export async function getContactCountSince(
  accountId: string,
  apiKey: string,
  afterDate: Date,
): Promise<number> {
  const dateStr = formatDateForApi(afterDate);
  let totalCount = 0;
  let offset = 0;

  while (true) {
    const body = new URLSearchParams({
      accountid: accountId,
      apikey: apiKey,
      response_type: 'json',
      adddateafter: dateStr,
      pagingsize: String(PAGE_SIZE),
      pagingoffset: String(offset),
    });

    const res = await fetch(ALLCLIENTS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!res.ok) {
      throw new Error(`AllClients API error: ${res.status} ${res.statusText}`);
    }

    const data: AllClientsResponse = await res.json();

    if (data.results?.error) {
      throw new Error(`AllClients API: ${data.results.error}`);
    }

    const raw = data.results?.contacts?.contact;
    const contacts = Array.isArray(raw) ? raw : raw ? [raw] : [];
    totalCount += contacts.length;

    if (contacts.length < PAGE_SIZE) {
      break;
    }
    offset += PAGE_SIZE;
  }

  return totalCount;
}

/**
 * Get the number of contacts added during a specific month.
 * Uses the subtraction method: contacts since start of month minus contacts since start of next month.
 */
export async function getMonthlyContactCount(
  accountId: string,
  apiKey: string,
  year: number,
  month: number,
): Promise<number> {
  const startOfMonth = new Date(year, month - 1, 1);
  const startOfNextMonth = new Date(year, month, 1);

  const [sinceStart, sinceNext] = await Promise.all([
    getContactCountSince(accountId, apiKey, startOfMonth),
    getContactCountSince(accountId, apiKey, startOfNextMonth),
  ]);

  const count = sinceStart - sinceNext;
  return Number.isNaN(count) || count < 0 ? 0 : count;
}
