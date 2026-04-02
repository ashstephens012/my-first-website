/**
 * SSE endpoint for AI course generation.
 * Extracts content from URL, generates course via Claude, streams progress to client.
 * Does NOT persist — the client receives a preview and persists via server action.
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAIConfigured } from '@/lib/ai/config';
import { extractContent } from '@/lib/ai/extract';
import { generateCourse } from '@/lib/ai/generate';

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: Request) {
  // Auth check — LEADERSHIP only
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'LEADERSHIP') {
    return new Response('Unauthorized', { status: 401 });
  }

  if (!isAIConfigured()) {
    return new Response('AI not configured', { status: 503 });
  }

  let url: string;
  try {
    const body = await req.json();
    url = body.url;
    if (!url || typeof url !== 'string') {
      return new Response('URL is required', { status: 400 });
    }
  } catch {
    return new Response('Invalid request body', { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(new TextEncoder().encode(sseEvent(event, data)));
      };

      try {
        // Phase 1: Extract content
        send('progress', { step: 'extracting', message: 'Extracting content from URL...' });
        const content = await extractContent(url);
        send('progress', {
          step: 'extracted',
          message: `Extracted "${content.title}" (${content.sourceType})`,
        });

        // Phase 2: Generate course
        send('progress', {
          step: 'generating',
          message: 'Generating course structure with AI...',
        });
        const course = await generateCourse(content);
        send('progress', {
          step: 'generated',
          message: `Generated course with ${course.modules.length} modules`,
        });

        // Send preview
        send('preview', course);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'An unexpected error occurred';
        send('error', { message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
