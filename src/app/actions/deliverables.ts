'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { populateDeliverables } from '@/lib/deliverables/tier-templates';

/**
 * Initialise deliverables for a member based on their membership tier.
 */
export async function initDeliverables(memberId: string, year: number) {
  try {
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: { membershipTier: true },
    });

    if (!member?.membershipTier) {
      return { success: false, error: 'Member has no membership tier set' };
    }

    await populateDeliverables(memberId, member.membershipTier, year);

    revalidatePath(`/dashboard/members/${memberId}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initialise deliverables',
    };
  }
}

const completionSchema = z.object({
  completedAt: z.coerce.date(),
  notes: z.string().optional(),
});

/**
 * Record a completion event for a deliverable.
 */
export async function recordCompletion(memberDeliverableId: string, formData: FormData) {
  try {
    const validated = completionSchema.parse({
      completedAt: formData.get('completedAt'),
      notes: (formData.get('notes') as string) || undefined,
    });

    const deliverable = await prisma.memberDeliverable.findUnique({
      where: { id: memberDeliverableId },
      select: { memberId: true },
    });

    if (!deliverable) {
      return { success: false, error: 'Deliverable not found' };
    }

    await prisma.deliverableCompletion.create({
      data: {
        memberDeliverableId,
        completedAt: validated.completedAt,
        notes: validated.notes || null,
      },
    });

    revalidatePath(`/dashboard/members/${deliverable.memberId}`);
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues.map((e) => e.message).join(', ') };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to record completion',
    };
  }
}

/**
 * Delete a completion record.
 */
export async function deleteCompletion(completionId: string, memberId: string) {
  try {
    await prisma.deliverableCompletion.delete({
      where: { id: completionId },
    });

    revalidatePath(`/dashboard/members/${memberId}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete completion',
    };
  }
}

/**
 * Update the annual allocation for a specific deliverable (admin tweak).
 */
/**
 * Add a Staff Turnover Protection Training slot.
 * Diamond members can have up to 3 slots, all other tiers up to 2.
 */
export async function addStaffTurnoverProtection(memberId: string, year: number) {
  try {
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: { membershipTier: true },
    });

    const tierLevel = (member?.membershipTier ?? '').trim().split(/\s+/).pop() ?? '';
    const maxSlots = tierLevel === 'Diamond' ? 3 : 2;

    const existing = await prisma.memberDeliverable.findMany({
      where: {
        memberId,
        year,
        category: 'Staff Turnover Protection',
      },
    });

    if (existing.length >= maxSlots) {
      return { success: false, error: `Maximum of ${maxSlots} Staff Turnover Protection Training slots allowed` };
    }

    const slotNumber = existing.length + 1;

    await prisma.memberDeliverable.create({
      data: {
        memberId,
        year,
        category: 'Staff Turnover Protection',
        name: `Additional Staff Turnover Protection Training ${slotNumber}`,
        annualAllocation: 4,
      },
    });

    revalidatePath(`/dashboard/members/${memberId}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add Staff Turnover Protection',
    };
  }
}

/**
 * Remove a Staff Turnover Protection Training slot.
 */
export async function removeStaffTurnoverProtection(deliverableId: string, memberId: string) {
  try {
    await prisma.memberDeliverable.delete({
      where: { id: deliverableId },
    });

    revalidatePath(`/dashboard/members/${memberId}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove Staff Turnover Protection',
    };
  }
}

/**
 * Update the planned month for a deliverable (1-12, or null to clear).
 */
export async function updatePlannedMonth(memberDeliverableId: string, plannedMonth: number | null, memberId: string) {
  try {
    if (plannedMonth !== null) {
      const monthSchema = z.number().int().min(1).max(12);
      monthSchema.parse(plannedMonth);
    }

    await prisma.memberDeliverable.update({
      where: { id: memberDeliverableId },
      data: { plannedMonth },
    });

    revalidatePath(`/dashboard/members/${memberId}`);
    revalidatePath('/portal');
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues.map((e) => e.message).join(', ') };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update planned month',
    };
  }
}

/**
 * Update the planned months array for a multi-instance deliverable.
 */
export async function updatePlannedMonths(memberDeliverableId: string, plannedMonths: number[], memberId: string) {
  try {
    const monthSchema = z.array(z.number().int().min(1).max(12));
    monthSchema.parse(plannedMonths);

    await prisma.memberDeliverable.update({
      where: { id: memberDeliverableId },
      data: { plannedMonths },
    });

    revalidatePath(`/dashboard/members/${memberId}`);
    revalidatePath('/portal');
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues.map((e) => e.message).join(', ') };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update planned months',
    };
  }
}

export async function updateAllocation(memberDeliverableId: string, newAllocation: number, memberId: string) {
  try {
    const allocationSchema = z.number().int().min(-1);
    allocationSchema.parse(newAllocation);

    await prisma.memberDeliverable.update({
      where: { id: memberDeliverableId },
      data: { annualAllocation: newAllocation },
    });

    revalidatePath(`/dashboard/members/${memberId}`);
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues.map((e) => e.message).join(', ') };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update allocation',
    };
  }
}
