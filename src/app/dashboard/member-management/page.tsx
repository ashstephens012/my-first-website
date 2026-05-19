import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getStaffMemberManagement } from '@/lib/staff/queries';
import MemberManagement from '@/components/MemberManagement';

export const dynamic = 'force-dynamic';

export default async function MemberManagementPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/signin');

  const result = await getStaffMemberManagement(session.user.name);

  if (result.members.length === 0 || !result.staffRole) {
    redirect('/dashboard');
  }

  return (
    <MemberManagement
      userName={session.user.name ?? ''}
      members={result.members}
      staffRole={result.staffRole}
      currentMonth={result.currentMonth}
      currentYear={result.currentYear}
    />
  );
}
