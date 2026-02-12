"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateResourcePage() {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState('LINK');
  const [lessonId, setLessonId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [courses, setCourses] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/my/courses')
      .then((r) => r.json())
      .then((data) => setCourses(data))
      .catch(() => setCourses([]));
  }, []);

  useEffect(() => {
    if (!courseId) return setLessons([]);
    fetch(`/api/lessons?courseId=${courseId}`)
      .then((r) => r.json())
      .then((data) => setLessons(data))
      .catch(() => setLessons([]));
  }, [courseId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch('/api/resources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, url, type, lessonId: lessonId || null, courseId: courseId || null }),
    });
    if (!res.ok) {
      const body = await res.json();
      setError(body?.error || 'Failed');
      return;
    }
    const resource = await res.json();
    router.push('/courses/' + (courses.find((c) => c.id === courseId)?.slug || ''));
  }

  return (
    <div className="max-w-2xl mx-auto py-12">
      <h1 className="text-2xl font-semibold mb-4">Add Resource</h1>
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
          <label className="block text-sm font-medium">Lesson (optional)</label>
          <select value={lessonId} onChange={(e) => setLessonId(e.target.value)} className="mt-1 w-full p-2 border rounded">
            <option value="">Attach to course (no lesson)</option>
            {lessons.map((l) => (
              <option key={l.id} value={l.id}>{l.title}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full p-2 border rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium">URL</label>
          <input value={url} onChange={(e) => setUrl(e.target.value)} className="mt-1 w-full p-2 border rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className="mt-1 p-2 border rounded">
            <option value="LINK">Link</option>
            <option value="PDF">PDF</option>
            <option value="VIDEO">Video</option>
          </select>
        </div>
        {error && <div className="text-red-600">{error}</div>}
        <div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded">Add Resource</button>
        </div>
      </form>
    </div>
  );
}
