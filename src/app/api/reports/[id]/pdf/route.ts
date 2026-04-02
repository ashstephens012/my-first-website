/**
 * API Route: PDF Download
 * Generates and serves PDF for a report — requires auth, member scope, and tier check
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { downloadPDF } from '@/lib/pdf/generator';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    // Admin users (non-MEMBER) bypass member/tier checks
    if (session.user.role === 'MEMBER') {
      // Tier 2 members cannot download PDFs
      if (session.user.portalTier === 2) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Verify the report belongs to this member
      const report = await prisma.report.findUnique({
        where: { id },
        select: { memberId: true },
      });

      if (!report || report.memberId !== session.user.memberId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const { buffer, filename } = await downloadPDF(id);

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
