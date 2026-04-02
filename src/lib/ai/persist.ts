/**
 * Persists an AI-generated course structure to the database using Prisma transactions.
 */

import prisma from '@/lib/prisma';
import type { GeneratedCourse } from './generate';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function persistCourse(generated: GeneratedCourse): Promise<string> {
  let slug = slugify(generated.title);

  // Check for slug collision, append timestamp if needed
  const existing = await prisma.course.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${Date.now()}`;
  }

  const course = await prisma.$transaction(async (tx) => {
    const course = await tx.course.create({
      data: {
        title: generated.title,
        slug,
        description: generated.description,
        difficulty: generated.difficulty,
        status: 'draft',
        sourceUrl: generated.sourceUrl,
      },
    });

    for (const mod of generated.modules) {
      const createdModule = await tx.module.create({
        data: {
          courseId: course.id,
          title: mod.title,
          description: mod.description,
          sortOrder: mod.sortOrder,
        },
      });

      for (const lesson of mod.lessons) {
        const createdLesson = await tx.lesson.create({
          data: {
            moduleId: createdModule.id,
            title: lesson.title,
            description: lesson.description,
            sortOrder: lesson.sortOrder,
          },
        });

        if (lesson.contentBlocks.length > 0) {
          await tx.contentBlock.createMany({
            data: lesson.contentBlocks.map((block) => ({
              lessonId: createdLesson.id,
              type: block.type,
              content: block.content || '',
              sortOrder: block.sortOrder,
            })),
          });
        }
      }
    }

    return course;
  });

  return course.id;
}
