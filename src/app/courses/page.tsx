import Link from 'next/link';
import prisma from '@/lib/prisma';

export default async function CoursesPage() {
  const courses = await prisma.course.findMany({ where: { published: true }, include: { instructor: true } });

  return (
    <div className="max-w-4xl mx-auto py-12">
      <h1 className="text-2xl font-semibold mb-6">Course Catalog</h1>
      <ul className="space-y-4">
        {courses.map((c) => (
          <li key={c.id} className="p-4 border rounded">
            <Link href={`/courses/${c.slug}`} className="text-lg font-medium">
              {c.title}
            </Link>
            <p className="text-sm text-gray-600">{c.description}</p>
            {c.instructor && <p className="text-xs text-gray-500 mt-2">Instructor: {c.instructor.name}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
