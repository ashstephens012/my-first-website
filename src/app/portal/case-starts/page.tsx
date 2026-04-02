import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import CaseStartForm from './CaseStartForm';

export const dynamic = 'force-dynamic';

export default async function CaseStartsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.memberId) redirect('/signin');

  const now = new Date();
  const currentYear = now.getFullYear();
  // If January, also fetch previous year so December's existing submission is available
  const yearsToFetch = now.getMonth() === 0 ? [currentYear - 1, currentYear] : [currentYear];

  const [member, submissions] = await Promise.all([
    prisma.member.findUnique({
      where: { id: session.user.memberId },
      select: { annualCaseStartsTarget: true },
    }),
    prisma.caseStartSubmission.findMany({
      where: { memberId: session.user.memberId, year: { in: yearsToFetch } },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
    }),
  ]);

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-brand-navy mb-2">Case Starts</h1>
      <p className="text-gray-600 mb-8">
        Submit your monthly case starts figures.
      </p>
      <CaseStartForm
        submissions={submissions.map((s) => ({
          id: s.id,
          year: s.year,
          month: s.month,
          caseStarts: s.caseStarts,
        }))}
        annualTarget={member?.annualCaseStartsTarget ?? null}
        currentYear={currentYear}
      />
    </div>
  );
}
