import { isAIConfigured } from '@/lib/ai/config';
import AIGenerateForm from './AIGenerateForm';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function AIGeneratePage() {
  const configured = isAIConfigured();

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Breadcrumbs */}
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/admin/courses" className="hover:text-brand-navy">
          Courses
        </Link>
        <span className="mx-2">/</span>
        <span className="text-brand-navy font-medium">AI Generate</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-navy">Generate Course with AI</h1>
        <p className="mt-2 text-gray-600">
          Paste a YouTube video or web page URL and AI will generate a complete course structure.
        </p>
      </div>

      {configured ? (
        <AIGenerateForm />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="text-4xl mb-4">🔑</div>
          <h2 className="text-xl font-semibold text-brand-navy mb-2">AI Not Configured</h2>
          <p className="text-gray-600 mb-4">
            To use AI course generation, add your Anthropic API key to the environment variables.
          </p>
          <code className="block bg-gray-100 rounded-lg p-4 text-sm text-left max-w-md mx-auto">
            ANTHROPIC_API_KEY=sk-ant-...
          </code>
        </div>
      )}
    </div>
  );
}
