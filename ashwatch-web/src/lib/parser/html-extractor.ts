/**
 * Extracts advisory text content from the raw BoM HTML page.
 * The BoM page contains advisory text inside `<pre>` tags.
 */
export function extractPreContent(html: string): string {
  const prePattern = /<pre[^>]*>([\s\S]*?)<\/pre>/gi;
  const lines: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = prePattern.exec(html)) !== null) {
    const rawContent = match[1] || '';
    // Strip any HTML tags inside <pre>
    const cleaned = rawContent.replace(/<[^>]*>/g, '');
    lines.push(cleaned);
  }

  return decodeHtmlEntities(lines.join('\n'));
}

/**
 * Decode common HTML entities.
 */
export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}
