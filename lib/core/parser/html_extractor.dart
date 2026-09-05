/// Extracts advisory text content from the raw BoM HTML page.
///
/// The BoM page contains advisory text inside `<pre>` tags, with multiple
/// VAAC sections (Anchorage, Buenos Aires, Darwin, etc.).
library;

/// Extracts all text content from `<pre>` tags in the raw HTML.
String extractPreContent(String html) {
  final buffer = StringBuffer();
  final pattern = RegExp(r'<pre[^>]*>(.*?)</pre>', dotAll: true, caseSensitive: false);

  for (final match in pattern.allMatches(html)) {
    final content = match.group(1) ?? '';
    // Strip any remaining HTML tags inside <pre>
    final cleaned = content.replaceAll(RegExp(r'<[^>]*>'), '');
    buffer.writeln(cleaned);
  }

  return buffer.toString();
}

/// Extracts only the Darwin VAAC section from the full BoM page content.
///
/// The page contains sections for multiple VAACs. We need the Darwin VAAC
/// section which contains Indonesian volcano advisories.
///
/// Returns the full text content — individual advisories are split later
/// by the VAA parser.
String extractDarwinVaacSection(String fullText) {
  // The Darwin VAAC section is preceded by a header like:
  // "VOLCANIC ASH ADVISORIES FROM DARWIN VAAC - LAST 7 DAYS"
  // It ends when the next VAAC section starts or at the end of content.

  // Actually, individual advisories have "VAAC: DARWIN" inside them.
  // We return the full text and let the VAA parser filter by VAAC: DARWIN
  // and AREA: INDONESIA.
  return fullText;
}

/// Decode common HTML entities.
String decodeHtmlEntities(String text) {
  return text
      .replaceAll('&amp;', '&')
      .replaceAll('&lt;', '<')
      .replaceAll('&gt;', '>')
      .replaceAll('&quot;', '"')
      .replaceAll('&#39;', "'")
      .replaceAll('&nbsp;', ' ');
}
