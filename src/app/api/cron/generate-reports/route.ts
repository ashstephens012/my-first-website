/**
 * Cron API Route: Generate Monthly Reports
 * Automatically generates reports for all active members
 * Runs on the 1st of each month at midnight
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateReportsForAllMembers } from '@/lib/reports/generator';

export async function GET(request: NextRequest) {
  // Verify request is from Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Calculate previous month
    const now = new Date();
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const year = previousMonth.getFullYear();
    const month = previousMonth.getMonth() + 1;

    console.log(`Generating reports for ${year}-${month}`);

    // Generate reports for all active members
    const results = await generateReportsForAllMembers(year, month);

    return NextResponse.json({
      success: true,
      year,
      month,
      generated: results.success.length,
      failed: results.failed.length,
      details: results,
    });
  } catch (error) {
    console.error('Error in cron job:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
