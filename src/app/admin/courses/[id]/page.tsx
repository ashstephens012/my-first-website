import { notFound } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import Protected from '@/components/Protected';

export const dynamic = 'force-dynamic';

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      modules: {
        orderBy: { sortOrder: 'asc' },
        include: {
          lessons: {
            orderBy: { sortOrder: 'asc' },
            include: {
              contentBlocks: {
                orderBy: { sortOrder: 'asc' },
              },
            },
          },
        },
      },
    },
  });

  if (!course) return notFound();

  const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const totalBlocks = course.modules.reduce(
    (sum, m) => sum + m.lessons.reduce((ls, l) => ls + l.contentBlocks.length, 0),
    0
  );

  return (
    <Protected>
      <div className="max-w-5xl mx-auto py-8 px-4">
        {/* Breadcrumbs */}
        <nav className="text-sm text-gray-500 mb-6">
          <Link href="/admin/courses" className="hover:text-brand-navy">
            Courses
          </Link>
          <span className="mx-2">/</span>
          <span className="text-brand-navy font-medium">{course.title}</span>
        </nav>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-brand-navy">{course.title}</h1>
            {course.description && (
              <p className="text-gray-600 mt-2 max-w-2xl">{course.description}</p>
            )}
            <div className="flex gap-3 mt-3 text-sm text-gray-500">
              <span>{course.modules.length} modules</span>
              <span>{totalLessons} lessons</span>
              <span>{totalBlocks} content blocks</span>
              {course.difficulty && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                  {course.difficulty}
                </span>
              )}
            </div>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              course.status === 'published'
                ? 'bg-green-100 text-green-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {course.status}
          </span>
        </div>

        {course.sourceUrl && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm">
            <span className="font-medium text-blue-800">AI Generated from: </span>
            <a
              href={course.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline break-all"
            >
              {course.sourceUrl}
            </a>
          </div>
        )}

        {/* Modules */}
        <div className="space-y-6">
          {course.modules.map((mod, mi) => (
            <div key={mod.id} className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-5 border-b border-gray-100">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Module {mi + 1}
                </span>
                <h2 className="text-lg font-semibold text-brand-navy">{mod.title}</h2>
                {mod.description && (
                  <p className="text-sm text-gray-500 mt-1">{mod.description}</p>
                )}
              </div>
              <div className="divide-y divide-gray-100">
                {mod.lessons.map((lesson, li) => (
                  <div key={lesson.id} className="p-5">
                    <h3 className="text-sm font-semibold text-gray-800">
                      {mi + 1}.{li + 1} {lesson.title}
                    </h3>
                    {lesson.description && (
                      <p className="text-xs text-gray-500 mt-0.5">{lesson.description}</p>
                    )}
                    <div className="mt-3 space-y-3">
                      {lesson.contentBlocks.map((block) => {
                        if (block.type === 'divider') {
                          return <hr key={block.id} className="border-gray-200" />;
                        }
                        if (block.type === 'callout') {
                          return (
                            <div
                              key={block.id}
                              className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r text-sm text-gray-700"
                            >
                              {block.content}
                            </div>
                          );
                        }
                        return (
                          <p key={block.id} className="text-sm text-gray-600 leading-relaxed">
                            {block.content}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Protected>
  );
}
