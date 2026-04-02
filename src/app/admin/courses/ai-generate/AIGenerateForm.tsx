'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createAICourse } from '@/app/actions/ai-course';
import type { GeneratedCourse } from '@/lib/ai/generate';

type ProgressStep = {
  step: string;
  message: string;
};

export default function AIGenerateForm() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [progress, setProgress] = useState<ProgressStep[]>([]);
  const [preview, setPreview] = useState<GeneratedCourse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());

  const handleGenerate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!url.trim() || loading) return;

      setLoading(true);
      setProgress([]);
      setPreview(null);
      setError(null);
      setExpandedModules(new Set());

      try {
        const res = await fetch('/api/ai/generate-course', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: url.trim() }),
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Request failed: ${res.status}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error('No response stream');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          let eventType = '';
          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7);
            } else if (line.startsWith('data: ') && eventType) {
              try {
                const data = JSON.parse(line.slice(6));
                if (eventType === 'progress') {
                  setProgress((prev) => [...prev, data as ProgressStep]);
                } else if (eventType === 'preview') {
                  setPreview(data as GeneratedCourse);
                } else if (eventType === 'error') {
                  setError(data.message);
                }
              } catch {
                // Skip malformed SSE data
              }
              eventType = '';
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    },
    [url, loading]
  );

  const handleCreate = useCallback(async () => {
    if (!preview || creating) return;
    setCreating(true);
    setError(null);

    try {
      const result = await createAICourse(preview);
      if (result.success && result.courseId) {
        router.push(`/admin/courses/${result.courseId}`);
      } else {
        setError(result.error || 'Failed to create course');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create course');
    } finally {
      setCreating(false);
    }
  }, [preview, creating, router]);

  const toggleModule = (index: number) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const totalLessons = preview?.modules.reduce((sum, m) => sum + m.lessons.length, 0) ?? 0;
  const totalBlocks = preview?.modules.reduce(
    (sum, m) => sum + m.lessons.reduce((ls, l) => ls + l.contentBlocks.length, 0),
    0
  ) ?? 0;

  return (
    <div className="space-y-6">
      {/* URL Input Form */}
      <form onSubmit={handleGenerate} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
          Source URL
        </label>
        <div className="flex gap-3">
          <input
            id="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=... or any web page URL"
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-navy focus:border-brand-navy outline-none"
            disabled={loading}
            required
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="inline-flex items-center gap-2 bg-brand-navy text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-navy/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <SpinnerIcon />
                Generating...
              </>
            ) : (
              <>
                <SparklesIcon />
                Generate Course
              </>
            )}
          </button>
        </div>
      </form>

      {/* Progress */}
      {progress.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Progress</h3>
          <div className="space-y-2">
            {progress.map((p, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <CheckIcon className="text-green-500" />
                <span className="text-gray-600">{p.message}</span>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-sm">
                <SpinnerIcon className="text-brand-navy" />
                <span className="text-gray-500">Working...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-red-800 mb-1">Error</h3>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="space-y-4">
          {/* Course Summary Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-brand-navy">{preview.title}</h2>
                <p className="text-gray-600 mt-1">{preview.description}</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                {preview.difficulty}
              </span>
            </div>
            <div className="flex gap-4 text-sm text-gray-500">
              <span>{preview.modules.length} modules</span>
              <span>{totalLessons} lessons</span>
              <span>{totalBlocks} content blocks</span>
            </div>
          </div>

          {/* Module/Lesson Tree */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
            {preview.modules.map((mod, mi) => (
              <div key={mi}>
                <button
                  onClick={() => toggleModule(mi)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Module {mi + 1}
                    </span>
                    <h3 className="text-sm font-semibold text-brand-navy">{mod.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{mod.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{mod.lessons.length} lessons</span>
                    <ChevronIcon expanded={expandedModules.has(mi)} />
                  </div>
                </button>
                {expandedModules.has(mi) && (
                  <div className="border-t border-gray-100 bg-gray-50 divide-y divide-gray-100">
                    {mod.lessons.map((lesson, li) => (
                      <div key={li} className="px-6 py-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-700">{lesson.title}</h4>
                          <span className="text-xs text-gray-400">
                            {lesson.contentBlocks.length} blocks
                          </span>
                        </div>
                        {lesson.description && (
                          <p className="text-xs text-gray-500 mt-0.5">{lesson.description}</p>
                        )}
                        <div className="flex gap-1.5 mt-1.5">
                          {lesson.contentBlocks.map((block, bi) => (
                            <span
                              key={bi}
                              className={`inline-block w-2 h-2 rounded-full ${
                                block.type === 'text'
                                  ? 'bg-blue-400'
                                  : block.type === 'callout'
                                    ? 'bg-amber-400'
                                    : 'bg-gray-300'
                              }`}
                              title={`${block.type}${block.content ? ': ' + block.content.slice(0, 50) + '...' : ''}`}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Create Course Button */}
          <div className="flex justify-end">
            <button
              onClick={handleCreate}
              disabled={creating}
              className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {creating ? (
                <>
                  <SpinnerIcon />
                  Creating Course...
                </>
              ) : (
                'Create Course'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline SVG icons to avoid lucide-react import issues in client components

function SparklesIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  );
}

function SpinnerIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={`w-4 h-4 animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

function CheckIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={`w-4 h-4 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}
