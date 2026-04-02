/**
 * Edit Member Page
 * Form to update an existing member
 */

import { notFound } from 'next/navigation';
import { getMemberWithReports } from '@/app/actions/members';
import EditMemberForm from './EditMemberForm';

export const dynamic = 'force-dynamic';

export default async function EditMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { member } = await getMemberWithReports(id);

  if (!member) {
    notFound();
  }

  return <EditMemberForm member={member} />;
}
