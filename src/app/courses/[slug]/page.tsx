import prisma from '@/lib/prisma';
import Link from 'next/link';
import { Lesson } from '@prisma/client';

type Props = { params: any };

export default async function CoursePage({ params }: Props) {
  const { slug } = (await params) as { slug: string };
  if (!slug || typeof slug !== 'string') return <div className="p-8">Course not found</div>;

  const course = await prisma.course.findUnique({ where: { slug }, include: { lessons: { orderBy: { order: 'asc' } }, instructor: true } });
  if (!course) return <div className="p-8">Course not found</div>;

  return (
    <div className="max-w-3xl mx-auto py-12">
      <h1 className="text-2xl font-semibold">{course.title}</h1>
      <p className="text-sm text-gray-600 mb-4">{course.description}</p>
      {course.instructor && <p className="text-xs text-gray-500">Instructor: {course.instructor.name}</p>}

      <h2 className="mt-6 text-lg font-medium">Lessons</h2>
      <ul className="mt-4 space-y-3">
        {course.lessons.map((l: Lesson) => (
          <li key={l.id} className="p-3 border rounded">
            <h3 className="font-medium">{l.title}</h3>
            <p className="text-sm text-gray-700">{l.content}</p>
          </li>
        ))}
      </ul>
      <div className="mt-6">
        <Link href="/courses" className="text-blue-600">Back to catalog</Link>
      </div>
    </div>
  );
}
