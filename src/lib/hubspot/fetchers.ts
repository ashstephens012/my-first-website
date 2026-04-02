/**
 * HubSpot Data Fetchers
 * READ-ONLY functions for retrieving company and engagement data
 *
 * IMPORTANT: All functions are read-only. No data is modified in HubSpot.
 */

import hubspotClient from './client';
import type {
  HubSpotCompany,
  HubSpotEmail,
  HubSpotMeeting,
  HubSpotContact,
  Activity,
  EmailActivity,
  MeetingActivity,
} from './types';
import { startOfMonth, endOfMonth } from 'date-fns';

/**
 * Fetch company details by HubSpot Company ID (READ-ONLY)
 */
export async function getCompanyDetails(
  companyId: string
): Promise<HubSpotCompany | null> {
  try {
    const response = await hubspotClient.crm.companies.basicApi.getById(
      companyId,
      ['name', 'domain', 'industry', 'date_joined_tio', 'membership_tier']
    );

    return {
      id: response.id,
      properties: response.properties as any,
      createdAt: response.createdAt?.toString() || '',
      updatedAt: response.updatedAt?.toString() || '',
    };
  } catch (error) {
    console.error(`Error fetching company ${companyId}:`, error);
    return null;
  }
}

/**
 * Fetch contact details by ID (READ-ONLY)
 */
async function getContactDetails(
  contactId: string
): Promise<HubSpotContact | null> {
  try {
    const response = await hubspotClient.crm.contacts.basicApi.getById(
      contactId,
      ['firstname', 'lastname', 'email']
    );

    return {
      id: response.id,
      properties: response.properties as any,
    };
  } catch (error) {
    console.error(`Error fetching contact ${contactId}:`, error);
    return null;
  }
}

/**
 * Fetch owner details by ID (READ-ONLY)
 */
async function getOwnerDetails(
  ownerId: string
): Promise<{ name: string } | null> {
  try {
    const response = await hubspotClient.crm.owners.ownersApi.getById(
      parseInt(ownerId)
    );
    const first = (response as any).firstName || '';
    const last = (response as any).lastName || '';
    const email = (response as any).email || '';
    const name = `${first} ${last}`.trim() || email;
    return name ? { name } : null;
  } catch (error) {
    console.error(`Error fetching owner ${ownerId}:`, error);
    return null;
  }
}

/**
 * Fetch all emails associated with a company for a specific month (READ-ONLY)
 */
export async function getEmailsForMonth(
  companyId: string,
  year: number,
  month: number
): Promise<EmailActivity[]> {
  try {
    const startDate = startOfMonth(new Date(year, month - 1));
    const endDate = endOfMonth(new Date(year, month - 1));

    // Search for emails using the engagements API
    const searchRequest = {
      filterGroups: [
        {
          filters: [
            {
              propertyName: 'associations.company',
              operator: 'EQ',
              value: companyId,
            },
            {
              propertyName: 'hs_timestamp',
              operator: 'GTE',
              value: startDate.getTime().toString(),
            },
            {
              propertyName: 'hs_timestamp',
              operator: 'LTE',
              value: endDate.getTime().toString(),
            },
          ],
        },
      ],
      properties: [
        'hs_timestamp',
        'hs_email_subject',
        'hs_email_text',
        'hs_email_html',
        'hs_email_direction',
      ],
      limit: 100,
    };

    const response = await hubspotClient.crm.objects.searchApi.doSearch(
      'emails',
      searchRequest as any
    );

    const emails: EmailActivity[] = [];

    for (const email of response.results) {
      const properties = email.properties as any;

      // Get associated contacts for participants
      let participants: string[] = [];
      const emailWithAssoc = email as any;
      if (emailWithAssoc.associations?.contacts) {
        const contactPromises = emailWithAssoc.associations.contacts.map((c: any) =>
          getContactDetails(c.id)
        );
        const contacts = await Promise.all(contactPromises);
        participants = contacts
          .filter((c): c is NonNullable<typeof c> => c !== null && !!c.properties.email)
          .map(
            (c) =>
              `${c.properties.firstname || ''} ${c.properties.lastname || ''}`.trim() ||
              c.properties.email!
          );
      }

      emails.push({
        id: email.id,
        type: 'email',
        date: new Date(properties.hs_timestamp),
        subject: properties.hs_email_subject || 'No Subject',
        content: properties.hs_email_text || properties.hs_email_html || '',
        direction: properties.hs_email_direction,
        participants,
      });
    }

    return emails.sort((a, b) => b.date.getTime() - a.date.getTime());
  } catch (error) {
    console.error(
      `Error fetching emails for company ${companyId}:`,
      error
    );
    return [];
  }
}

/**
 * Fetch all meetings associated with a company for a specific month (READ-ONLY)
 */
export async function getMeetingsForMonth(
  companyId: string,
  year: number,
  month: number
): Promise<MeetingActivity[]> {
  try {
    const startDate = startOfMonth(new Date(year, month - 1));
    const endDate = endOfMonth(new Date(year, month - 1));

    // Search for meetings using the engagements API
    const searchRequest = {
      filterGroups: [
        {
          filters: [
            {
              propertyName: 'associations.company',
              operator: 'EQ',
              value: companyId,
            },
            {
              propertyName: 'hs_timestamp',
              operator: 'GTE',
              value: startDate.getTime().toString(),
            },
            {
              propertyName: 'hs_timestamp',
              operator: 'LTE',
              value: endDate.getTime().toString(),
            },
          ],
        },
      ],
      properties: [
        'hs_timestamp',
        'hs_meeting_start_time',
        'hs_meeting_title',
        'hs_meeting_body',
        'hs_internal_meeting_notes',
        'hs_meeting_outcome',
        'hs_attendee_owner_ids',
        'hubspot_owner_id',
      ],
      limit: 100,
    };

    const response = await hubspotClient.crm.objects.searchApi.doSearch(
      'meetings',
      searchRequest as any
    );

    const meetings: MeetingActivity[] = [];

    for (const meeting of response.results) {
      const properties = meeting.properties as any;

      // Fetch associated contacts via the Associations API
      let participants: string[] = [];
      try {
        const assocResponse = await hubspotClient.crm.associations.v4.basicApi.getPage(
          'meetings',
          meeting.id,
          'contacts',
          undefined,
          100
        );
        if (assocResponse.results && assocResponse.results.length > 0) {
          const contactIds = assocResponse.results.map((a: any) => a.toObjectId);
          const contactPromises = contactIds.map((id: string) =>
            getContactDetails(id)
          );
          const contacts = await Promise.all(contactPromises);
          participants = contacts
            .filter((c): c is NonNullable<typeof c> => c !== null && !!c.properties.email)
            .map(
              (c) =>
                `${c.properties.firstname || ''} ${c.properties.lastname || ''}`.trim() ||
                c.properties.email!
            );
        }
      } catch (assocError) {
        console.error(`Error fetching associations for meeting ${meeting.id}:`, assocError);
      }

      // Fetch internal attendees (HubSpot owners)
      // hubspot_owner_id = meeting organiser, hs_attendee_owner_ids = additional internal attendees
      const ownerIds: string[] = [];
      if (properties.hubspot_owner_id) {
        ownerIds.push(properties.hubspot_owner_id);
      }
      if (properties.hs_attendee_owner_ids) {
        const additionalIds = properties.hs_attendee_owner_ids
          .split(';')
          .map((id: string) => id.trim())
          .filter(Boolean);
        ownerIds.push(...additionalIds);
      }
      if (ownerIds.length > 0) {
        try {
          const uniqueOwnerIds = [...new Set(ownerIds)];
          const ownerPromises = uniqueOwnerIds.map((id: string) => getOwnerDetails(id));
          const owners = await Promise.all(ownerPromises);
          const ownerNames = owners
            .filter((o): o is NonNullable<typeof o> => o !== null)
            .map((o) => o.name);
          participants.push(...ownerNames);
        } catch (ownerError) {
          console.error(`Error fetching owner details for meeting ${meeting.id}:`, ownerError);
        }
      }

      meetings.push({
        id: meeting.id,
        type: 'meeting',
        date: new Date(properties.hs_meeting_start_time || properties.hs_timestamp),
        subject: properties.hs_meeting_title || 'Untitled Meeting',
        notes:
          properties.hs_internal_meeting_notes ||
          properties.hs_meeting_body ||
          '',
        outcome: properties.hs_meeting_outcome,
        participants,
      });
    }

    return meetings.sort((a, b) => b.date.getTime() - a.date.getTime());
  } catch (error) {
    console.error(
      `Error fetching meetings for company ${companyId}:`,
      error
    );
    return [];
  }
}

/**
 * Fetch upcoming meetings associated with a company (READ-ONLY)
 * Returns all meetings with start time >= now, sorted soonest first.
 */
export async function getUpcomingMeetings(
  companyId: string
): Promise<MeetingActivity[]> {
  try {
    const searchRequest = {
      filterGroups: [
        {
          filters: [
            {
              propertyName: 'associations.company',
              operator: 'EQ',
              value: companyId,
            },
            {
              propertyName: 'hs_meeting_start_time',
              operator: 'GTE',
              value: Date.now().toString(),
            },
          ],
        },
      ],
      properties: [
        'hs_timestamp',
        'hs_meeting_start_time',
        'hs_meeting_title',
        'hs_meeting_body',
        'hs_meeting_outcome',
        'hs_attendee_owner_ids',
        'hubspot_owner_id',
      ],
      sorts: [{ propertyName: 'hs_meeting_start_time', direction: 'ASCENDING' }],
      limit: 20,
    };

    const response = await hubspotClient.crm.objects.searchApi.doSearch(
      'meetings',
      searchRequest as any
    );

    const meetings: MeetingActivity[] = [];

    for (const meeting of response.results) {
      const properties = meeting.properties as any;

      // Fetch associated contacts via the Associations API
      let participants: string[] = [];
      try {
        const assocResponse = await hubspotClient.crm.associations.v4.basicApi.getPage(
          'meetings',
          meeting.id,
          'contacts',
          undefined,
          100
        );
        if (assocResponse.results && assocResponse.results.length > 0) {
          const contactIds = assocResponse.results.map((a: any) => a.toObjectId);
          const contactPromises = contactIds.map((id: string) =>
            getContactDetails(id)
          );
          const contacts = await Promise.all(contactPromises);
          participants = contacts
            .filter((c): c is NonNullable<typeof c> => c !== null && !!c.properties.email)
            .map(
              (c) =>
                `${c.properties.firstname || ''} ${c.properties.lastname || ''}`.trim() ||
                c.properties.email!
            );
        }
      } catch (assocError) {
        console.error(`Error fetching associations for meeting ${meeting.id}:`, assocError);
      }

      // Fetch internal attendees (HubSpot owners)
      const ownerIds: string[] = [];
      if (properties.hubspot_owner_id) {
        ownerIds.push(properties.hubspot_owner_id);
      }
      if (properties.hs_attendee_owner_ids) {
        const additionalIds = properties.hs_attendee_owner_ids
          .split(';')
          .map((id: string) => id.trim())
          .filter(Boolean);
        ownerIds.push(...additionalIds);
      }
      if (ownerIds.length > 0) {
        try {
          const uniqueOwnerIds = [...new Set(ownerIds)];
          const ownerPromises = uniqueOwnerIds.map((id: string) => getOwnerDetails(id));
          const owners = await Promise.all(ownerPromises);
          const ownerNames = owners
            .filter((o): o is NonNullable<typeof o> => o !== null)
            .map((o) => o.name);
          participants.push(...ownerNames);
        } catch (ownerError) {
          console.error(`Error fetching owner details for meeting ${meeting.id}:`, ownerError);
        }
      }

      meetings.push({
        id: meeting.id,
        type: 'meeting' as const,
        date: new Date(properties.hs_meeting_start_time || properties.hs_timestamp),
        subject: properties.hs_meeting_title || 'Untitled Meeting',
        notes: properties.hs_meeting_body || '',
        outcome: properties.hs_meeting_outcome,
        participants,
      });
    }

    return meetings;
  } catch (error) {
    console.error(
      `Error fetching upcoming meetings for company ${companyId}:`,
      error
    );
    return [];
  }
}

/**
 * Fetch all activities (emails + meetings) for a company in a specific month (READ-ONLY)
 */
export async function getActivitiesForMonth(
  companyId: string,
  year: number,
  month: number
): Promise<Activity[]> {
  const [emails, meetings] = await Promise.all([
    getEmailsForMonth(companyId, year, month),
    getMeetingsForMonth(companyId, year, month),
  ]);

  const activities: Activity[] = [...emails, ...meetings];
  return activities.sort((a, b) => b.date.getTime() - a.date.getTime());
}
