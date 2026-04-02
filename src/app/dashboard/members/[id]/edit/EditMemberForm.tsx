'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Protected from '@/components/Protected';
import { updateMember } from '@/app/actions/members';
import type { Member } from '@prisma/client';

export default function EditMemberForm({ member }: { member: Member }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await updateMember(member.id, formData);

      if (result.success) {
        router.push(`/dashboard/members/${member.id}`);
      } else {
        setError(result.error || 'Failed to update member');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Protected>
      <div className="max-w-2xl mx-auto py-8 px-4">
        <nav className="mb-8 text-sm">
          <Link
            href="/dashboard/members"
            className="text-brand-navy hover:text-brand-navy/70"
          >
            Members
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <Link
            href={`/dashboard/members/${member.id}`}
            className="text-brand-navy hover:text-brand-navy/70"
          >
            {member.name}
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-600">Edit</span>
        </nav>

        <h1 className="text-3xl font-bold text-brand-navy mb-8">Edit Member</h1>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                defaultValue={member.name}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-navy focus:border-brand-navy"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                defaultValue={member.email}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-navy focus:border-brand-navy"
              />
            </div>

            <div>
              <label
                htmlFor="websiteUrl"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Website URL (optional)
              </label>
              <input
                type="url"
                id="websiteUrl"
                name="websiteUrl"
                placeholder="https://example.com"
                defaultValue={member.websiteUrl || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-navy focus:border-brand-navy"
              />
              <p className="mt-1 text-xs text-gray-500">
                The practice website. A logo will be automatically extracted for reports.
              </p>
            </div>

            <div>
              <label
                htmlFor="hubspotCompanyId"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                HubSpot Company ID
              </label>
              <input
                type="text"
                id="hubspotCompanyId"
                name="hubspotCompanyId"
                required
                defaultValue={member.hubspotCompanyId}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-navy focus:border-brand-navy"
              />
              <p className="mt-1 text-xs text-gray-500">
                The Company ID from HubSpot used to fetch emails and meetings.
              </p>
            </div>

            <div>
              <label
                htmlFor="allClientsAccountId"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                AllClients Account ID (optional)
              </label>
              <input
                type="text"
                id="allClientsAccountId"
                name="allClientsAccountId"
                defaultValue={member.allClientsAccountId || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-navy focus:border-brand-navy"
              />
              <p className="mt-1 text-xs text-gray-500">
                Numeric Account ID from the member&apos;s AllClients PRM account.
              </p>
            </div>

            <div>
              <label
                htmlFor="allClientsApiKey"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                AllClients API Key (optional)
              </label>
              <input
                type="text"
                id="allClientsApiKey"
                name="allClientsApiKey"
                defaultValue={member.allClientsApiKey || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-navy focus:border-brand-navy"
              />
              <p className="mt-1 text-xs text-gray-500">
                Numeric API Key from the member&apos;s AllClients PRM account.
              </p>
            </div>

            <div>
              <label
                htmlFor="consultantName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Consultant (optional)
              </label>
              <select
                id="consultantName"
                name="consultantName"
                defaultValue={member.consultantName || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-navy focus:border-brand-navy"
              >
                <option value="">Select a consultant</option>
                <option value="Carla Duarte">Carla Duarte</option>
                <option value="Kelly Miller">Kelly Miller</option>
                <option value="Michelle Park">Michelle Park</option>
                <option value="Bree Hoskin">Bree Hoskin</option>
                <option value="Tessa Lee">Tessa Lee</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="digitalStrategistName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Digital Strategist (optional)
              </label>
              <select
                id="digitalStrategistName"
                name="digitalStrategistName"
                defaultValue={member.digitalStrategistName || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-navy focus:border-brand-navy"
              >
                <option value="">Select a digital strategist</option>
                <option value="Aida Shokrgozar">Aida Shokrgozar</option>
                <option value="Zafar Hyder">Zafar Hyder</option>
                <option value="Nick Tinsley">Nick Tinsley</option>
                <option value="Kunjal Kanabar">Kunjal Kanabar</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="region"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Region
              </label>
              <select
                id="region"
                name="region"
                required
                defaultValue={member.region || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-navy focus:border-brand-navy"
              >
                <option value="">Select a region</option>
                <option value="UKI">UKI</option>
                <option value="ANZ">ANZ</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue={member.status}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-navy focus:border-brand-navy"
              >
                <option value="active">Active</option>
                <option value="onboarding">Onboarding</option>
                <option value="notice_given">Notice Given</option>
                <option value="offboarding">Offboarding</option>
                <option value="previous_member">Previous Member</option>
              </select>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between">
              <Link
                href={`/dashboard/members/${member.id}`}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-navy hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-navy disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Protected>
  );
}
