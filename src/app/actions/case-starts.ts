'use server';

import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const caseStartSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
  caseStarts: z.coerce.number().int().min(0),
});

/**
 * Portal member submits their own case starts for a given month.
 * Uses memberId from session for security.
 */
export async function submitCaseStart(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.memberId) {
      return { success: false, error: 'Not authenticated' };
    }

    const validated = caseStartSchema.parse({
      year: formData.get('year'),
      month: formData.get('month'),
      caseStarts: formData.get('caseStarts'),
    });

    await prisma.caseStartSubmission.upsert({
      where: {
        memberId_year_month: {
          memberId: session.user.memberId,
          year: validated.year,
          month: validated.month,
        },
      },
      update: { caseStarts: validated.caseStarts },
      create: {
        memberId: session.user.memberId,
        year: validated.year,
        month: validated.month,
        caseStarts: validated.caseStarts,
      },
    });

    revalidatePath('/portal');
    revalidatePath('/portal/case-starts');
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues.map((e) => e.message).join(', ') };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit case starts',
    };
  }
}

/**
 * Admin submits/updates case starts for any member.
 */
export async function adminSubmitCaseStart(memberId: string, formData: FormData) {
  try {
    const validated = caseStartSchema.parse({
      year: formData.get('year'),
      month: formData.get('month'),
      caseStarts: formData.get('caseStarts'),
    });

    await prisma.caseStartSubmission.upsert({
      where: {
        memberId_year_month: {
          memberId,
          year: validated.year,
          month: validated.month,
        },
      },
      update: { caseStarts: validated.caseStarts },
      create: {
        memberId,
        year: validated.year,
        month: validated.month,
        caseStarts: validated.caseStarts,
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
      error: error instanceof Error ? error.message : 'Failed to submit case starts',
    };
  }
}

/**
 * Admin deletes a case start submission.
 */
export async function adminDeleteCaseStart(submissionId: string, memberId: string) {
  try {
    await prisma.caseStartSubmission.delete({
      where: { id: submissionId },
    });

    revalidatePath(`/dashboard/members/${memberId}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete submission',
    };
  }
}
