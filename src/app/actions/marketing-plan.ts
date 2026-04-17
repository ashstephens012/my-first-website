'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { populateMarketingPlan } from '@/lib/marketing-plan/templates';

/**
 * Initialise a marketing plan for a member from their tier template.
 */
export async function initMarketingPlan(memberId: string, year: number) {
  try {
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: { membershipTier: true },
    });

    if (!member?.membershipTier) {
      return { success: false, error: 'Member has no membership tier set' };
    }

    await populateMarketingPlan(memberId, member.membershipTier, year);

    revalidatePath(`/dashboard/members/${memberId}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initialise marketing plan',
    };
  }
}

const addChannelSchema = z.object({
  name: z.string().min(1, 'Channel name is required'),
  alwaysOn: z.boolean().default(false),
  description: z.string().optional(),
});

/**
 * Add a custom channel to a marketing plan.
 */
export async function addMarketingChannel(
  memberId: string,
  year: number,
  data: { name: string; alwaysOn: boolean; description?: string }
) {
  try {
    const validated = addChannelSchema.parse(data);

    const plan = await prisma.marketingPlan.findUnique({
      where: { memberId_year: { memberId, year } },
      include: { channels: { select: { sortOrder: true } } },
    });

    if (!plan) {
      return { success: false, error: 'Marketing plan not found. Initialise the plan first.' };
    }

    const maxSort = plan.channels.reduce((max, c) => Math.max(max, c.sortOrder), -1);

    await prisma.marketingChannel.create({
      data: {
        marketingPlanId: plan.id,
        name: validated.name,
        alwaysOn: validated.alwaysOn,
        description: validated.description ?? null,
        sortOrder: maxSort + 1,
      },
    });

    revalidatePath(`/dashboard/members/${memberId}`);
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues.map((e) => e.message).join(', ') };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add channel',
    };
  }
}

const updateChannelSchema = z.object({
  name: z.string().min(1).optional(),
  alwaysOn: z.boolean().optional(),
  description: z.string().nullable().optional(),
});

/**
 * Update a marketing channel.
 */
export async function updateMarketingChannel(
  channelId: string,
  memberId: string,
  data: { name?: string; alwaysOn?: boolean; description?: string | null }
) {
  try {
    const validated = updateChannelSchema.parse(data);

    // Verify ownership
    const channel = await prisma.marketingChannel.findUnique({
      where: { id: channelId },
      include: { marketingPlan: { select: { memberId: true } } },
    });

    if (!channel || channel.marketingPlan.memberId !== memberId) {
      return { success: false, error: 'Channel not found' };
    }

    await prisma.marketingChannel.update({
      where: { id: channelId },
      data: validated,
    });

    revalidatePath(`/dashboard/members/${memberId}`);
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues.map((e) => e.message).join(', ') };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update channel',
    };
  }
}

/**
 * Delete a marketing channel and all its activities.
 */
export async function deleteMarketingChannel(channelId: string, memberId: string) {
  try {
    const channel = await prisma.marketingChannel.findUnique({
      where: { id: channelId },
      include: { marketingPlan: { select: { memberId: true } } },
    });

    if (!channel || channel.marketingPlan.memberId !== memberId) {
      return { success: false, error: 'Channel not found' };
    }

    await prisma.marketingChannel.delete({ where: { id: channelId } });

    revalidatePath(`/dashboard/members/${memberId}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete channel',
    };
  }
}

const activitySchema = z.object({
  month: z.number().min(1).max(12),
  label: z.string().min(1, 'Label is required'),
  ownership: z.enum(['TIO', 'PRACTICE']),
});

/**
 * Add an activity to a marketing channel.
 */
export async function addMarketingActivity(
  channelId: string,
  memberId: string,
  data: { month: number; label: string; ownership: string }
) {
  try {
    const validated = activitySchema.parse(data);

    const channel = await prisma.marketingChannel.findUnique({
      where: { id: channelId },
      include: {
        marketingPlan: { select: { memberId: true } },
        activities: { select: { sortOrder: true } },
      },
    });

    if (!channel || channel.marketingPlan.memberId !== memberId) {
      return { success: false, error: 'Channel not found' };
    }

    const maxSort = channel.activities.reduce((max, a) => Math.max(max, a.sortOrder), -1);

    await prisma.marketingActivity.create({
      data: {
        marketingChannelId: channelId,
        month: validated.month,
        label: validated.label,
        ownership: validated.ownership,
        sortOrder: maxSort + 1,
      },
    });

    revalidatePath(`/dashboard/members/${memberId}`);
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues.map((e) => e.message).join(', ') };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add activity',
    };
  }
}

const updateActivitySchema = z.object({
  month: z.number().min(1).max(12).optional(),
  label: z.string().min(1).optional(),
  ownership: z.enum(['TIO', 'PRACTICE']).optional(),
});

/**
 * Update a marketing activity.
 */
export async function updateMarketingActivity(
  activityId: string,
  memberId: string,
  data: { month?: number; label?: string; ownership?: string }
) {
  try {
    const validated = updateActivitySchema.parse(data);

    const activity = await prisma.marketingActivity.findUnique({
      where: { id: activityId },
      include: {
        marketingChannel: {
          include: { marketingPlan: { select: { memberId: true } } },
        },
      },
    });

    if (!activity || activity.marketingChannel.marketingPlan.memberId !== memberId) {
      return { success: false, error: 'Activity not found' };
    }

    await prisma.marketingActivity.update({
      where: { id: activityId },
      data: validated,
    });

    revalidatePath(`/dashboard/members/${memberId}`);
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues.map((e) => e.message).join(', ') };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update activity',
    };
  }
}

/**
 * Delete a marketing activity.
 */
export async function deleteMarketingActivity(activityId: string, memberId: string) {
  try {
    const activity = await prisma.marketingActivity.findUnique({
      where: { id: activityId },
      include: {
        marketingChannel: {
          include: { marketingPlan: { select: { memberId: true } } },
        },
      },
    });

    if (!activity || activity.marketingChannel.marketingPlan.memberId !== memberId) {
      return { success: false, error: 'Activity not found' };
    }

    await prisma.marketingActivity.delete({ where: { id: activityId } });

    revalidatePath(`/dashboard/members/${memberId}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete activity',
    };
  }
}
