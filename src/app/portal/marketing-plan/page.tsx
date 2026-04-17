import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import MarketingPlanGrid from '@/components/MarketingPlanGrid';

export const dynamic = 'force-dynamic';

export default async function PortalMarketingPlanPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.memberId) redirect('/signin');

  const currentYear = new Date().getFullYear();

  const plan = await prisma.marketingPlan.findUnique({
    where: { memberId_year: { memberId: session.user.memberId, year: currentYear } },
    include: {
      channels: {
        orderBy: { sortOrder: 'asc' },
        include: { activities: { orderBy: [{ month: 'asc' }, { sortOrder: 'asc' }] } },
      },
    },
  });

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-brand-navy mb-2">
        Marketing Plan
      </h1>
      <p className="text-gray-600 mb-8">
        Your 12-month strategic marketing overview for {currentYear}.
      </p>

      {plan ? (
        <MarketingPlanGrid plan={plan} />
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-brand-navy">
            No marketing plan yet
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Your consultant will set up your marketing plan shortly.
          </p>
        </div>
      )}
    </div>
  );
}
