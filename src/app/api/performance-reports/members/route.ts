/**
 * API Route: Get members for performance report generation
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role === 'MEMBER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const members = await prisma.member.findMany({
    where: { status: 'active' },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      allClientsAccountId: true,
      performanceConfig: {
        select: { averageOrderValue: true, funnelMappingDone: true },
      },
    },
  });

  const result = members
    .filter((m) => m.allClientsAccountId)
    .map((m) => ({
      id: m.id,
      name: m.name,
      hasConfig: !!(m.performanceConfig?.averageOrderValue && m.performanceConfig.funnelMappingDone),
    }));

  return NextResponse.json({ members: result });
}
