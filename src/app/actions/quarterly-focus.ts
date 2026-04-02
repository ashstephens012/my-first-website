'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const quarterlyFocusSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  quarter: z.coerce.number().int().min(1).max(4),
  focus: z.string().min(1, 'Focus text is required'),
});

/**
 * Admin upserts quarterly focus text for a member.
 */
export async function adminUpsertQuarterlyFocus(memberId: string, formData: FormData) {
  try {
    const validated = quarterlyFocusSchema.parse({
      year: formData.get('year'),
      quarter: formData.get('quarter'),
      focus: formData.get('focus'),
    });

    await prisma.quarterlyFocus.upsert({
      where: {
        memberId_year_quarter: {
          memberId,
          year: validated.year,
          quarter: validated.quarter,
        },
      },
      update: { focus: validated.focus },
      create: {
        memberId,
        year: validated.year,
        quarter: validated.quarter,
        focus: validated.focus,
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
      error: error instanceof Error ? error.message : 'Failed to save quarterly focus',
    };
  }
}

/**
 * Admin deletes a quarterly focus entry.
 */
export async function adminDeleteQuarterlyFocus(id: string, memberId: string) {
  try {
    await prisma.quarterlyFocus.delete({
      where: { id },
    });

    revalidatePath(`/dashboard/members/${memberId}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete quarterly focus',
    };
  }
}
