"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateCoursePage() {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch('/api/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, slug, description }),
    });
    if (!res.ok) {
      const body = await res.json();
      setError(body?.error || 'Failed');
      return;
    }
    router.push('/courses/' + slug);
  }

  return (
    <div className="max-w-2xl mx-auto py-12">
      <h1 className="text-2xl font-semibold mb-4">Create Course</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full p-2 border rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium">Slug (url)</label>
          <input value={slug} onChange={(e) => setSlug(e.target.value)} className="mt-1 w-full p-2 border rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 w-full p-2 border rounded" />
        </div>
        {error && <div className="text-red-600">{error}</div>}
        <div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded">Create</button>
        </div>
      </form>
    </div>
  );
}
