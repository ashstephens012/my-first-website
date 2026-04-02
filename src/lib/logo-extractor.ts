/**
 * Logo Extractor
 * Fetches a website and extracts the best available logo URL
 */

/**
 * Extract a logo URL from a website by checking common sources:
 * 1. apple-touch-icon (high-res, widely available)
 * 2. og:image (Open Graph)
 * 3. link rel="icon" with .png/.svg (skip .ico — unsupported by react-pdf)
 * 4. Fallback: Google Favicon API at 128px
 */
export async function extractLogoUrl(websiteUrl: string): Promise<string | null> {
  try {
    const url = new URL(websiteUrl);
    const origin = url.origin;

    const response = await fetch(websiteUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LogoExtractor/1.0)' },
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return getFallbackFavicon(origin);
    }

    const html = await response.text();

    // 1. apple-touch-icon
    const appleTouchIcon = extractAttribute(html, /<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i);
    if (appleTouchIcon) return resolveUrl(appleTouchIcon, origin);

    // Also check reversed attribute order
    const appleTouchIcon2 = extractAttribute(html, /<link[^>]*href=["']([^"']+)["'][^>]*rel=["']apple-touch-icon["']/i);
    if (appleTouchIcon2) return resolveUrl(appleTouchIcon2, origin);

    // 2. og:image
    const ogImage = extractAttribute(html, /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
    if (ogImage) return resolveUrl(ogImage, origin);

    const ogImage2 = extractAttribute(html, /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
    if (ogImage2) return resolveUrl(ogImage2, origin);

    // 3. link rel="icon" with .png or .svg (skip .ico)
    const iconMatches = html.matchAll(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/gi);
    for (const match of iconMatches) {
      const href = match[1];
      if (/\.(png|svg)(\?|$)/i.test(href)) {
        return resolveUrl(href, origin);
      }
    }
    // Also reversed attribute order
    const iconMatches2 = html.matchAll(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["']/gi);
    for (const match of iconMatches2) {
      const href = match[1];
      if (/\.(png|svg)(\?|$)/i.test(href)) {
        return resolveUrl(href, origin);
      }
    }

    // 4. Fallback: Google Favicon API
    return getFallbackFavicon(origin);
  } catch (error) {
    console.error('Error extracting logo:', error);
    try {
      const origin = new URL(websiteUrl).origin;
      return getFallbackFavicon(origin);
    } catch {
      return null;
    }
  }
}

function extractAttribute(html: string, regex: RegExp): string | null {
  const match = html.match(regex);
  return match ? match[1] : null;
}

function resolveUrl(href: string, origin: string): string {
  if (href.startsWith('http://') || href.startsWith('https://')) {
    return href;
  }
  if (href.startsWith('//')) {
    return 'https:' + href;
  }
  if (href.startsWith('/')) {
    return origin + href;
  }
  return origin + '/' + href;
}

function getFallbackFavicon(origin: string): string {
  const domain = new URL(origin).hostname;
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}
