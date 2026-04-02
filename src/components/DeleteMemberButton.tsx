'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteMember } from '@/app/actions/members';

export default function DeleteMemberButton({
  memberId,
  memberName,
}: {
  memberId: string;
  memberName: string;
}) {
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!window.confirm(`Are you sure you want to delete ${memberName}?`)) {
      return;
    }

    setDeleting(true);
    const result = await deleteMember(memberId);

    if (result.success) {
      router.push('/dashboard/members');
    } else {
      setDeleting(false);
      alert(result.error ?? 'Failed to delete member');
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="inline-flex items-center px-3 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {deleting ? 'Deleting...' : 'Delete'}
    </button>
  );
}
