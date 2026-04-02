/**
 * TypeScript types for HubSpot API responses
 * All types represent READ-ONLY data structures from HubSpot
 */

export interface HubSpotCompany {
  id: string;
  properties: {
    name: string;
    domain?: string;
    industry?: string;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

export interface HubSpotEmail {
  id: string;
  properties: {
    hs_timestamp: string;
    hs_email_subject: string;
    hs_email_text: string;
    hs_email_html?: string;
    hs_email_direction?: string;
    hs_email_status?: string;
  };
  associations?: {
    contacts?: Array<{ id: string }>;
    companies?: Array<{ id: string }>;
  };
}

export interface HubSpotMeeting {
  id: string;
  properties: {
    hs_timestamp: string;
    hs_meeting_title: string;
    hs_meeting_body?: string;
    hs_meeting_outcome?: string;
    hs_meeting_start_time?: string;
    hs_meeting_end_time?: string;
    hs_internal_meeting_notes?: string;
  };
  associations?: {
    contacts?: Array<{ id: string }>;
    companies?: Array<{ id: string }>;
  };
}

export interface HubSpotContact {
  id: string;
  properties: {
    firstname?: string;
    lastname?: string;
    email?: string;
  };
}

export interface EmailActivity {
  id: string;
  type: 'email';
  date: Date;
  subject: string;
  content: string;
  direction?: string;
  participants: string[];
}

export interface MeetingActivity {
  id: string;
  type: 'meeting';
  date: Date;
  subject: string;
  notes: string;
  outcome?: string;
  participants: string[];
}

export type Activity = EmailActivity | MeetingActivity;
