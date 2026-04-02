'use server';

import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getMonthlyContactCount } from '@/lib/allclients';

/**
 * Portal member triggers an on-demand refresh of their PRM contact data.
 */
export async function refreshPrmData() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.memberId) {
      return { success: false, error: 'Not authenticated' };
    }

    const member = await prisma.member.findUnique({
      where: { id: session.user.memberId },
      select: {
        id: true,
        allClientsAccountId: true,
        allClientsApiKey: true,
      },
    });

    if (!member?.allClientsAccountId || !member?.allClientsApiKey) {
      return { success: false, error: 'No AllClients credentials configured' };
    }

    // Build list of the current partial month + last 6 complete months + their prior-year equivalents
    const now = new Date();
    const months: { year: number; month: number }[] = [];
    // Current partial month
    months.push({ year: now.getFullYear(), month: now.getMonth() + 1 });
    for (let i = 1; i <= 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
      months.push({ year: d.getFullYear() - 1, month: d.getMonth() + 1 });
    }

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
    }

    revalidatePath('/portal');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to refresh PRM data',
    };
  }
}

/**
 * Admin triggers a PRM contact sync for a specific member.
 */
export async function adminRefreshPrmData(memberId: string) {
  try {
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        allClientsAccountId: true,
        allClientsApiKey: true,
      },
    });

    if (!member?.allClientsAccountId || !member?.allClientsApiKey) {
      return { success: false, error: 'No AllClients credentials configured' };
    }

    const now = new Date();
    const months: { year: number; month: number }[] = [];
    // Current partial month
    months.push({ year: now.getFullYear(), month: now.getMonth() + 1 });
    for (let i = 1; i <= 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
      months.push({ year: d.getFullYear() - 1, month: d.getMonth() + 1 });
    }

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
    }

    revalidatePath(`/dashboard/members/${memberId}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to refresh PRM data',
    };
  }
}
