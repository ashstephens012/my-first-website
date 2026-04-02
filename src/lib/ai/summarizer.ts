/**
 * AI Content Summarizer using Anthropic Claude API
 * Generates executive summary for monthly reports
 */

import Anthropic from '@anthropic-ai/sdk';
import { EXECUTIVE_SUMMARY_PROMPT, MEETING_SUMMARY_PROMPT } from './prompts';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Helper to check if Anthropic is configured
export function isAnthropicConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

// Use Claude 3.5 Sonnet for quality and cost balance
const MODEL = 'claude-sonnet-4-5-20250929';

interface ActivityData {
  type: 'email' | 'meeting';
  date: Date;
  subject: string;
  participants: string;
}

/**
 * Generate executive summary for entire month's activities
 */
export async function generateExecutiveSummary(
  activities: ActivityData[],
  month: string,
  emailCount: number,
  meetingCount: number
): Promise<string> {
  try {
    // Format raw activity data for the prompt
    const activityList = activities
      .slice(0, 30) // Limit to 30 activities
      .map((a) => {
        const dateStr = a.date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
        const participants = a.participants ? JSON.parse(a.participants) : [];
        const participantStr = participants.length > 0 ? ` (${participants.join(', ')})` : '';
        return `${dateStr} - ${a.type.toUpperCase()}: ${a.subject}${participantStr}`;
      })
      .join('\n');

    const prompt = EXECUTIVE_SUMMARY_PROMPT.replace(
      '{emailCount}',
      emailCount.toString()
    )
      .replace('{meetingCount}', meetingCount.toString())
      .replace('{month}', month)
      .replace('{activityList}', activityList);

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 800,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const textContent = message.content.find((c) => c.type === 'text');
    return textContent && 'text' in textContent
      ? textContent.text.trim()
      : 'Executive summary not available';
  } catch (error) {
    console.error('Error generating executive summary:', error);
    return 'Unable to generate executive summary';
  }
}

/**
 * Generate a brief summary and extract actions from a single meeting
 */
export async function summarizeMeeting(
  subject: string,
  notes: string,
  participants: string[]
): Promise<{ summary: string; actions: string[] }> {
  const fallback = { summary: '', actions: [] };

  if (!notes || notes.trim().length === 0) {
    return fallback;
  }

  try {
    const prompt = MEETING_SUMMARY_PROMPT
      .replace('{subject}', subject)
      .replace('{participants}', participants.join(', '))
      .replace('{notes}', notes.slice(0, 3000));

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = message.content.find((c) => c.type === 'text');
    if (!textContent || !('text' in textContent)) {
      return fallback;
    }

    // Strip markdown code blocks if the AI wraps the JSON in ```json ... ```
    let jsonText = textContent.text.trim();
    const codeBlockMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1].trim();
    }

    const parsed = JSON.parse(jsonText);
    return {
      summary: parsed.summary || '',
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
    };
  } catch (error) {
    console.error(`Error summarizing meeting "${subject}":`, error);
    return fallback;
  }
}
