/**
 * Claude-powered course generation from extracted content.
 * Takes extracted text and generates a structured course with modules, lessons, and content blocks.
 */

import { getAnthropicClient } from './config';
import type { ExtractedContent } from './extract';

const MODEL = 'claude-sonnet-4-5-20250929';
const MAX_SOURCE_CHARS = 80_000;

export interface GeneratedContentBlock {
  type: 'text' | 'callout' | 'divider';
  content: string;
  sortOrder: number;
}

export interface GeneratedLesson {
  title: string;
  description: string;
  sortOrder: number;
  contentBlocks: GeneratedContentBlock[];
}

export interface GeneratedModule {
  title: string;
  description: string;
  sortOrder: number;
  lessons: GeneratedLesson[];
}

export interface GeneratedCourse {
  title: string;
  description: string;
  difficulty: string;
  sourceUrl: string;
  modules: GeneratedModule[];
}

const SYSTEM_PROMPT = `You are an expert instructional designer. Given source content extracted from a URL, create a well-structured online course.

Output ONLY valid JSON matching this exact structure (no markdown, no code fences):

{
  "title": "Course title",
  "description": "2-3 sentence course description",
  "difficulty": "beginner" | "intermediate" | "advanced",
  "modules": [
    {
      "title": "Module title",
      "description": "Module description",
      "sortOrder": 0,
      "lessons": [
        {
          "title": "Lesson title",
          "description": "Lesson description",
          "sortOrder": 0,
          "contentBlocks": [
            { "type": "text", "content": "...", "sortOrder": 0 },
            { "type": "callout", "content": "...", "sortOrder": 1 },
            { "type": "divider", "content": "", "sortOrder": 2 }
          ]
        }
      ]
    }
  ]
}

Rules:
- Create 2-5 modules, each with 2-5 lessons
- Each lesson should have 3-8 content blocks
- Content block types: "text" (main content), "callout" (key takeaways, tips, warnings), "divider" (visual separator, empty content)
- Start each lesson with an introductory "text" block
- End each lesson with a "callout" block summarizing key takeaways
- All sortOrder values must be sequential starting from 0
- Write content in clear, educational prose — not bullet points
- Reorganize and expand on the source material for pedagogical clarity
- Do NOT include video, image, or code blocks — only text, callout, and divider`;

export async function generateCourse(content: ExtractedContent): Promise<GeneratedCourse> {
  const client = getAnthropicClient();
  if (!client) {
    throw new Error('Anthropic API key is not configured');
  }

  const truncatedText = content.text.slice(0, MAX_SOURCE_CHARS);

  const userPrompt = `Create a course from this ${content.sourceType === 'youtube' ? 'video transcript' : 'article/web page'}.

Source: "${content.title}"
URL: ${content.url}
${content.durationSeconds ? `Duration: ${Math.round(content.durationSeconds / 60)} minutes` : ''}

--- SOURCE CONTENT ---
${truncatedText}
--- END SOURCE CONTENT ---`;

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    messages: [{ role: 'user', content: userPrompt }],
    system: SYSTEM_PROMPT,
  });

  const textContent = message.content.find((c) => c.type === 'text');
  if (!textContent || !('text' in textContent)) {
    throw new Error('No text response from Claude');
  }

  // Strip markdown code fences if present
  let jsonText = textContent.text.trim();
  const codeBlockMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonText = codeBlockMatch[1].trim();
  }

  const parsed = JSON.parse(jsonText) as GeneratedCourse;

  // Basic validation
  if (!parsed.title || !parsed.modules || !Array.isArray(parsed.modules)) {
    throw new Error('Invalid course structure returned from AI');
  }

  if (parsed.modules.length === 0) {
    throw new Error('AI generated a course with no modules');
  }

  // Attach source URL
  parsed.sourceUrl = content.url;

  return parsed;
}
