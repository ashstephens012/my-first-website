import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getStaffMembers } from '@/lib/staff/queries';
import StaffDashboard from '@/components/StaffDashboard';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/signin');

  const { members, staffRole } = await getStaffMembers(session.user.name);

  if (members.length === 0 || !staffRole) {
    redirect('/dashboard/reports');
  }

  return (
    <StaffDashboard
      userName={session.user.name ?? ''}
      members={members}
      staffRole={staffRole}
    />
  );
}
