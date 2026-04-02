/**
 * One-off API Route: Backfill membershipTier from HubSpot
 * Fetches membership_tier for all members that don't have membershipTier set yet
 *
 * Usage: GET /api/cron/backfill-membership-tier
 * Requires: Authorization: Bearer <CRON_SECRET>
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCompanyDetails } from '@/lib/hubspot/fetchers';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const members = await prisma.member.findMany({
      where: { membershipTier: null },
      select: { id: true, name: true, hubspotCompanyId: true },
    });

    const results = { updated: [] as string[], skipped: [] as string[], failed: [] as string[] };

    for (const member of members) {
      try {
        const company = await getCompanyDetails(member.hubspotCompanyId);
        const membershipTier = company?.properties?.membership_tier;

        if (membershipTier) {
          await prisma.member.update({
            where: { id: member.id },
            data: { membershipTier },
          });
          results.updated.push(member.name);
        } else {
          results.skipped.push(member.name);
        }
      } catch (error) {
        console.error(`Failed to backfill membershipTier for ${member.name}:`, error);
        results.failed.push(member.name);
      }
    }

    return NextResponse.json({
      success: true,
      total: members.length,
      updated: results.updated.length,
      skipped: results.skipped.length,
      failed: results.failed.length,
      details: results,
    });
  } catch (error) {
    console.error('Error in backfill:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
