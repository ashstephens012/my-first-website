'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { persistCourse } from '@/lib/ai/persist';
import { revalidatePath } from 'next/cache';
import type { GeneratedCourse } from '@/lib/ai/generate';

export async function createAICourse(
  courseData: GeneratedCourse
): Promise<{ success: boolean; courseId?: string; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'LEADERSHIP') {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const courseId = await persistCourse(courseData);
    revalidatePath('/admin/courses');
    return { success: true, courseId };
  } catch (error) {
    console.error('Error creating AI course:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create course',
    };
  }
}
