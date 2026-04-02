import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Protected from '@/components/Protected';
import UserRoleManager from '@/components/UserRoleManager';
import MemberUserList from '@/components/MemberUserList';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const session = await getServerSession(authOptions);

  const [staffUsers, memberUsers] = await Promise.all([
    prisma.user.findMany({
      where: { role: { not: 'MEMBER' } },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    }),
    prisma.user.findMany({
      where: { role: 'MEMBER' },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        portalTier: true,
        jobTitle: true,
        memberId: true,
        member: { select: { id: true, name: true } },
        passwordHash: true,
        createdAt: true,
      },
    }),
  ]);

  // Map to flag whether the user has set a password (without leaking the hash)
  const memberUsersClean = memberUsers.map(({ passwordHash, ...rest }) => ({
    ...rest,
    hasPassword: !!passwordHash,
  }));

  return (
    <Protected>
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Staff / Admin users */}
        <div className="mb-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-brand-navy">Users</h1>
            <p className="mt-2 text-gray-600">
              Manage admin and colleague accounts
            </p>
          </div>

          {staffUsers.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
              <h3 className="text-lg font-medium text-brand-navy">No staff users yet</h3>
              <p className="mt-2 text-sm text-gray-500">
                Users will appear here once they sign up.
              </p>
            </div>
          ) : (
            <UserRoleManager
              users={staffUsers}
              currentUserRole={session?.user?.role ?? 'USER'}
              currentUserId={session?.user?.id ?? ''}
            />
          )}
        </div>

        {/* Member portal users */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-brand-navy">Member Portal Users</h2>
            <p className="mt-2 text-gray-600">
              All users with access to the member portal ({memberUsersClean.length} total)
            </p>
          </div>

          {memberUsersClean.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
              <h3 className="text-lg font-medium text-brand-navy">No member portal users yet</h3>
              <p className="mt-2 text-sm text-gray-500">
                Member portal logins are created from each member&apos;s detail page.
              </p>
            </div>
          ) : (
            <MemberUserList
              users={memberUsersClean}
              currentUserRole={session?.user?.role ?? 'USER'}
            />
          )}
        </div>
      </div>
    </Protected>
  );
}
