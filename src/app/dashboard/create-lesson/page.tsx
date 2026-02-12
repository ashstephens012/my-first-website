"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateLessonPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [order, setOrder] = useState(1);
  const [courseId, setCourseId] = useState('');
  const [courses, setCourses] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/my/courses')
      .then((r) => r.json())
      .then((data) => setCourses(data))
      .catch(() => setCourses([]));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch('/api/lessons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, order, courseId }),
    });
    if (!res.ok) {
      const body = await res.json();
      setError(body?.error || 'Failed');
      return;
    }
    const lesson = await res.json();
    router.push('/courses/' + courses.find((c) => c.id === courseId)?.slug || '/courses');
  }

  return (
    <div className="max-w-2xl mx-auto py-12">
      <h1 className="text-2xl font-semibold mb-4">Create Lesson</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Course</label>
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="mt-1 w-full p-2 border rounded">
            <option value="">Select a course</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full p-2 border rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium">Content</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} className="mt-1 w-full p-2 border rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium">Order</label>
          <input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} className="mt-1 w-24 p-2 border rounded" />
        </div>
        {error && <div className="text-red-600">{error}</div>}
        <div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded">Create Lesson</button>
        </div>
      </form>
    </div>
  );
}
