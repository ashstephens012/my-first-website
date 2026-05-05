/**
 * AllClients PRM API Client
 * Fetches contact counts and category data from the AllClients API.
 */

import type { PrmCategory, PrmContact } from '@/types/performance-report';

const ALLCLIENTS_API_BASE = 'https://prm.growdental.com/api/2/';
const PAGE_SIZE = 100;

interface AllClientsResponse {
  results?: {
    error?: string;
    contacts?: {
      contact?: unknown[] | unknown;
    };
    categories?: {
      category?: unknown[] | unknown;
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
 * Generic helper to call any AllClients API endpoint.
 */
async function callAllClientsApi(
  endpoint: string,
  accountId: string,
  apiKey: string,
  extraParams: Record<string, string> = {},
): Promise<AllClientsResponse> {
  const body = new URLSearchParams({
    accountid: accountId,
    apikey: apiKey,
    response_type: 'json',
    ...extraParams,
  });

  const res = await fetch(`${ALLCLIENTS_API_BASE}${endpoint}`, {
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

  return data;
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
    const data = await callAllClientsApi('GetContacts.aspx', accountId, apiKey, {
      adddateafter: dateStr,
      pagingsize: String(PAGE_SIZE),
      pagingoffset: String(offset),
    });

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

/**
 * Get all PRM categories for an account.
 */
export async function getCategories(
  accountId: string,
  apiKey: string,
): Promise<PrmCategory[]> {
  const data = await callAllClientsApi('GetCategories.aspx', accountId, apiKey);

  const raw = data.results?.categories?.category;
  const categories = Array.isArray(raw) ? raw : raw ? [raw] : [];

  return categories.map((c: any) => ({
    categoryid: String(c.categoryid ?? c.CategoryID ?? ''),
    categoryname: String(c.categoryname ?? c.CategoryName ?? ''),
  }));
}

/**
 * Get contacts added during a date range with their category assignments.
 * Note: The API has no `adddatebefore` parameter, so we fetch all contacts
 * added after the start date and filter client-side.
 */
export async function getContactsWithCategories(
  accountId: string,
  apiKey: string,
  afterDate: Date,
  beforeDate?: Date,
): Promise<PrmContact[]> {
  const dateStr = formatDateForApi(afterDate);
  const allContacts: PrmContact[] = [];
  let offset = 0;

  while (true) {
    const data = await callAllClientsApi('GetContacts.aspx', accountId, apiKey, {
      adddateafter: dateStr,
      getcategories: '1',
      pagingsize: String(PAGE_SIZE),
      pagingoffset: String(offset),
    });

    const raw = data.results?.contacts?.contact;
    const contacts = Array.isArray(raw) ? raw : raw ? [raw] : [];

    for (const c of contacts as any[]) {
      allContacts.push({
        contactid: String(c.contactid ?? ''),
        firstname: String(c.firstname ?? ''),
        lastname: String(c.lastname ?? ''),
        adddate: String(c.adddate ?? ''),
        categories: c.categories ?? undefined,
      });
    }

    if (contacts.length < PAGE_SIZE) {
      break;
    }
    offset += PAGE_SIZE;
  }

  // Filter by beforeDate client-side if provided
  if (beforeDate) {
    const beforeTime = beforeDate.getTime();
    return allContacts.filter((c) => {
      const addTime = new Date(c.adddate).getTime();
      return !isNaN(addTime) && addTime < beforeTime;
    });
  }

  return allContacts;
}

/**
 * Count contacts in a specific category added after a date.
 */
export async function getContactCountByCategory(
  accountId: string,
  apiKey: string,
  categoryId: string,
  afterDate: Date,
): Promise<number> {
  const dateStr = formatDateForApi(afterDate);
  let totalCount = 0;
  let offset = 0;

  while (true) {
    const data = await callAllClientsApi('GetContacts.aspx', accountId, apiKey, {
      adddateafter: dateStr,
      categoryid: categoryId,
      pagingsize: String(PAGE_SIZE),
      pagingoffset: String(offset),
    });

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
