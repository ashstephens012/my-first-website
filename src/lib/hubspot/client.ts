/**
 * HubSpot API Client
 * READ-ONLY client for fetching company and engagement data
 *
 * IMPORTANT: This client only performs READ operations.
 * No data is written to or modified in HubSpot.
 */

import { Client } from '@hubspot/api-client';

// Initialize HubSpot client with API key
// Note: Client will throw errors at runtime if API key is missing and methods are called
export const hubspotClient = new Client({
  accessToken: process.env.HUBSPOT_API_KEY || '',
});

// Helper to check if HubSpot is configured
export function isHubSpotConfigured(): boolean {
  return !!process.env.HUBSPOT_API_KEY;
}

// Export typed client for use throughout the application
export default hubspotClient;
