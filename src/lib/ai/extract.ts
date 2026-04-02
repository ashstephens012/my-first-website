/**
 * URL content extraction for AI course generation.
 * Detects URL type (YouTube, web page) and extracts text content.
 */

import { YoutubeTranscript } from 'youtube-transcript';
import * as cheerio from 'cheerio';

export interface ExtractedContent {
  sourceType: 'youtube' | 'webpage';
  title: string;
  text: string;
  url: string;
  durationSeconds?: number;
}

const VIDEO_FILE_EXTENSIONS = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v'];

function isYouTubeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === 'www.youtube.com' ||
      parsed.hostname === 'youtube.com' ||
      parsed.hostname === 'youtu.be' ||
      parsed.hostname === 'm.youtube.com'
    );
  } catch {
    return false;
  }
}

function isVideoFileUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return VIDEO_FILE_EXTENSIONS.some((ext) => parsed.pathname.toLowerCase().endsWith(ext));
  } catch {
    return false;
  }
}

function extractYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'youtu.be') {
      return parsed.pathname.slice(1);
    }
    return parsed.searchParams.get('v');
  } catch {
    return null;
  }
}

async function extractYouTube(url: string): Promise<ExtractedContent> {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) throw new Error('Could not parse YouTube video ID from URL');

  // Fetch title via oEmbed API
  let title = 'YouTube Video';
  try {
    const oembedRes = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );
    if (oembedRes.ok) {
      const data = await oembedRes.json();
      title = data.title || title;
    }
  } catch {
    // Title is best-effort
  }

  // Fetch transcript
  const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
  if (!transcriptItems || transcriptItems.length === 0) {
    throw new Error(
      'No transcript available for this YouTube video. The video may not have captions enabled.'
    );
  }

  const text = transcriptItems.map((item) => item.text).join(' ');
  const lastItem = transcriptItems[transcriptItems.length - 1];
  const durationSeconds = lastItem ? Math.round(lastItem.offset / 1000 + (lastItem.duration || 0) / 1000) : undefined;

  return { sourceType: 'youtube', title, text, url, durationSeconds };
}

async function extractWebPage(url: string): Promise<ExtractedContent> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; TIOCourseBot/1.0)',
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch page: ${res.status} ${res.statusText}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  // Remove non-content elements
  $('script, style, nav, footer, header, aside, iframe, noscript, .sidebar, .nav, .footer, .header, .cookie-banner, .advertisement').remove();

  // Try to get main content, fall back to body
  let contentEl = $('main, article, [role="main"], .content, .post-content, .entry-content').first();
  if (contentEl.length === 0) {
    contentEl = $('body');
  }

  const text = contentEl.text().replace(/\s+/g, ' ').trim();
  const title = $('title').text().trim() || $('h1').first().text().trim() || 'Web Page';

  if (text.length < 100) {
    throw new Error('Could not extract meaningful content from this page. The page may require JavaScript to render.');
  }

  return { sourceType: 'webpage', title, text, url };
}

export async function extractContent(url: string): Promise<ExtractedContent> {
  // Validate URL
  try {
    new URL(url);
  } catch {
    throw new Error('Please enter a valid URL');
  }

  if (isVideoFileUrl(url)) {
    throw new Error(
      'Direct video file URLs (.mp4, .webm, etc.) are not yet supported. Please use a YouTube URL or a web page URL instead.'
    );
  }

  if (isYouTubeUrl(url)) {
    return extractYouTube(url);
  }

  return extractWebPage(url);
}
