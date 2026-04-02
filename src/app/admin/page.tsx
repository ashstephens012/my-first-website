import Link from 'next/link';
import prisma from '@/lib/prisma';
import Protected from '@/components/Protected';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const [courseCount, draftCount] = await Promise.all([
    prisma.course.count(),
    prisma.course.count({ where: { status: 'draft' } }),
  ]);

  return (
    <Protected>
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-navy">Admin</h1>
          <p className="mt-2 text-gray-600">Course management and tools</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
            <div className="text-sm font-medium text-gray-500 mb-1">Total Courses</div>
            <div className="text-2xl font-bold text-brand-navy">{courseCount}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
            <div className="text-sm font-medium text-gray-500 mb-1">Drafts</div>
            <div className="text-2xl font-bold text-brand-navy">{draftCount}</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-brand-navy mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Link
              href="/admin/courses"
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-brand-navy/30 hover:bg-gray-50 transition-colors"
            >
              <span className="text-2xl">📚</span>
              <div>
                <div className="text-sm font-medium text-brand-navy">View All Courses</div>
                <div className="text-xs text-gray-500">Browse and manage courses</div>
              </div>
            </Link>
            <Link
              href="/admin/courses/ai-generate"
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-brand-navy/30 hover:bg-gray-50 transition-colors"
            >
              <span className="text-2xl">✨</span>
              <div>
                <div className="text-sm font-medium text-brand-navy">Generate a course with AI</div>
                <div className="text-xs text-gray-500">Create a course from a URL</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </Protected>
  );
}
