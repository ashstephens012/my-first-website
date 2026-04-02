/**
 * Cron API Route: Sync PRM Contact Counts
 * Fetches monthly new-contact counts from AllClients for each member.
 * Runs on the 2nd of each month at 6 AM UTC.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getMonthlyContactCount } from '@/lib/allclients';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Build list of the last 6 complete months
    const now = new Date();
    const months: { year: number; month: number }[] = [];
    for (let i = 1; i <= 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
    }

    console.log(
      `Syncing PRM contact counts for last 6 months: ${months.map((m) => `${m.year}-${String(m.month).padStart(2, '0')}`).join(', ')}`,
    );

    // Fetch members with AllClients credentials
    const members = await prisma.member.findMany({
      where: {
        status: 'active',
        allClientsAccountId: { not: null },
        allClientsApiKey: { not: null },
      },
      select: {
        id: true,
        name: true,
        allClientsAccountId: true,
        allClientsApiKey: true,
      },
    });

    const results = { synced: [] as string[], skipped: [] as string[], failed: [] as { name: string; error: string }[] };

    for (const member of members) {
      if (!member.allClientsAccountId || !member.allClientsApiKey) {
        results.skipped.push(member.name);
        continue;
      }

      try {
        for (const { year, month } of months) {
          const contactCount = await getMonthlyContactCount(
            member.allClientsAccountId,
            member.allClientsApiKey,
            year,
            month,
          );

          await prisma.prmContactCount.upsert({
            where: {
              memberId_year_month: {
                memberId: member.id,
                year,
                month,
              },
            },
            update: { contactCount },
            create: {
              memberId: member.id,
              year,
              month,
              contactCount,
            },
          });

          console.log(`  ${member.name}: ${year}-${String(month).padStart(2, '0')} → ${contactCount} contacts`);
        }

        results.synced.push(member.name);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        console.error(`  ${member.name}: FAILED - ${msg}`);
        results.failed.push({ name: member.name, error: msg });
      }
    }

    return NextResponse.json({
      success: true,
      months,
      synced: results.synced.length,
      skipped: results.skipped.length,
      failed: results.failed.length,
      details: results,
    });
  } catch (error) {
    console.error('Error in PRM contacts cron:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
