import Link from 'next/link';
import prisma from '@/lib/prisma';
import Protected from '@/components/Protected';

export const dynamic = 'force-dynamic';

export default async function CoursesPage() {
  const courses = await prisma.course.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      modules: {
        include: {
          lessons: true,
        },
      },
    },
  });

  return (
    <Protected>
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-brand-navy">Courses</h1>
            <p className="mt-2 text-gray-600">Manage training courses</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/courses/ai-generate"
              className="inline-flex items-center gap-2 border border-brand-navy text-brand-navy px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-navy/5 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
              AI Generate
            </Link>
            <Link
              href="/admin/courses/new"
              className="inline-flex items-center gap-2 bg-brand-navy text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-navy/90 transition-colors"
            >
              + New Course
            </Link>
          </div>
        </div>

        {courses.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-500 mb-4">No courses yet. Create your first course!</p>
            <Link
              href="/admin/courses/ai-generate"
              className="inline-flex items-center gap-2 bg-brand-navy text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-navy/90 transition-colors"
            >
              Generate with AI
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {courses.map((course) => {
              const lessonCount = course.modules.reduce(
                (sum, m) => sum + m.lessons.length,
                0
              );
              return (
                <Link
                  key={course.id}
                  href={`/admin/courses/${course.id}`}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:border-brand-navy/30 transition-colors block"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-brand-navy">{course.title}</h3>
                      {course.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{course.description}</p>
                      )}
                      <div className="flex gap-3 mt-2 text-xs text-gray-400">
                        <span>{course.modules.length} modules</span>
                        <span>{lessonCount} lessons</span>
                        {course.sourceUrl && <span>AI generated</span>}
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        course.status === 'published'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {course.status}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </Protected>
  );
}
