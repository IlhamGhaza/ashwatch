import 'package:latlong2/latlong.dart';
import 'package:ashwatch/core/parser/coordinate_parser.dart';
import 'package:ashwatch/core/utils/date_utils.dart';
import 'package:ashwatch/data/models/volcano_advisory.dart';

/// Parses the full BoM VAA text content into a list of [VolcanoAdvisory].
///
/// This parser handles the BoM's text format, which wraps long lines and
/// contains multiple advisory blocks separated by "VA ADVISORY" headers.
class VaaParser {
  /// Parse the raw text content (already extracted from HTML) into advisories.
  ///
  /// Only returns advisories where AREA matches [areaFilter] (default: INDONESIA).
  List<VolcanoAdvisory> parse(String text, {String areaFilter = 'INDONESIA'}) {
    final advisories = <VolcanoAdvisory>[];
    final blocks = _splitAdvisoryBlocks(text);

    for (final block in blocks) {
      try {
        final advisory = _parseAdvisoryBlock(block);
        if (advisory != null &&
            advisory.area.toUpperCase().contains(areaFilter.toUpperCase())) {
          advisories.add(advisory);
        }
      } catch (e) {
        // Log error and continue parsing other advisories.
        // A malformed advisory should not crash the entire parser.
        // ignore: avoid_print
        print('VaaParser: Failed to parse advisory block: $e');
      }
    }

    return advisories;
  }

  /// Deduplicate advisories by volcano name, keeping only the newest
  /// advisory (by DTG) for each volcano.
  List<VolcanoAdvisory> deduplicateByVolcano(List<VolcanoAdvisory> advisories) {
    final byVolcano = <String, VolcanoAdvisory>{};

    for (final advisory in advisories) {
      final key = advisory.volcanoName.toUpperCase();
      final existing = byVolcano[key];

      if (existing == null || advisory.dtg.isAfter(existing.dtg)) {
        byVolcano[key] = advisory;
      }
    }

    return byVolcano.values.toList();
  }

  /// Split the full text into individual VA ADVISORY blocks.
  List<String> _splitAdvisoryBlocks(String text) {
    final blocks = <String>[];

    // Split on "VA ADVISORY" headers
    final parts = text.split(RegExp(r'(?=VA ADVISORY\b)', multiLine: true));

    for (final part in parts) {
      final trimmed = part.trim();
      if (trimmed.startsWith('VA ADVISORY')) {
        blocks.add(trimmed);
      }
    }

    return blocks;
  }

  /// Parse a single VA ADVISORY block into a [VolcanoAdvisory].
  VolcanoAdvisory? _parseAdvisoryBlock(String block) {
    // Normalize the block: join wrapped lines but preserve section headers
    final normalized = _normalizeBlock(block);

    // Extract key-value fields
    final dtgStr = _extractField(normalized, 'DTG');
    final volcanoStr = _extractField(normalized, 'VOLCANO');
    final psnStr = _extractField(normalized, 'PSN');
    final area = _extractField(normalized, 'AREA');
    final sourceElev = _extractField(normalized, 'SOURCE ELEV');
    final advisoryNr = _extractField(normalized, 'ADVISORY NR');
    final infoSource = _extractField(normalized, 'INFO SOURCE');
    final eruptionDetails = _extractField(normalized, 'ERUPTION DETAILS');
    final remarks = _extractField(normalized, 'RMK');
    final nextAdvisory = _extractField(normalized, 'NXT ADVISORY');

    if (dtgStr == null || volcanoStr == null || area == null || advisoryNr == null) {
      return null;
    }

    // Parse DTG
    final dtg = parseDtg(dtgStr);
    if (dtg == null) return null;

    // Parse volcano name and code
    final volcanoMatch = RegExp(r'^(.+?)\s+(\d{5,6})\s*$').firstMatch(volcanoStr.trim());
    final volcanoName = volcanoMatch?.group(1)?.trim() ?? volcanoStr.trim();
    final volcanoCode = volcanoMatch?.group(2);

    // Parse position
    LatLng? position;
    if (psnStr != null) {
      position = parseAviationCoordinate(psnStr);
    }

    // Check for NO VA EXP or VA NOT IDENTIFIABLE
    final noVaExp = normalized.contains('NO VA EXP');
    final vaNotId = normalized.contains('VA NOT IDENTIFIABLE');

    // Parse polygons
    final polygons = <AshPolygon>[];

    // OBS VA CLD or EST VA CLD
    final obsSection = _extractSection(normalized, r'OBS VA CLD\s*:');
    final estSection = _extractSection(normalized, r'EST VA CLD\s*:');

    if (obsSection != null) {
      polygons.addAll(_parsePolygonSection(obsSection, PolygonType.observed, dtg));
    }
    if (estSection != null) {
      polygons.addAll(_parsePolygonSection(estSection, PolygonType.estimated, dtg));
    }

    // FCST VA CLD +6 HR
    final fcst6Section = _extractSection(normalized, r'FCST VA CLD \+6 HR\s*:');
    if (fcst6Section != null) {
      polygons.addAll(_parsePolygonSection(fcst6Section, PolygonType.forecast6h, dtg));
    }

    // FCST VA CLD +12 HR
    final fcst12Section = _extractSection(normalized, r'FCST VA CLD \+12 HR\s*:');
    if (fcst12Section != null) {
      polygons.addAll(_parsePolygonSection(fcst12Section, PolygonType.forecast12h, dtg));
    }

    // FCST VA CLD +18 HR
    final fcst18Section = _extractSection(normalized, r'FCST VA CLD \+18 HR\s*:');
    if (fcst18Section != null) {
      polygons.addAll(_parsePolygonSection(fcst18Section, PolygonType.forecast18h, dtg));
    }

    return VolcanoAdvisory(
      volcanoName: volcanoName,
      volcanoCode: volcanoCode,
      position: position,
      area: area,
      sourceElevation: sourceElev,
      advisoryNumber: advisoryNr,
      dtg: dtg,
      eruptionDetails: eruptionDetails,
      infoSource: infoSource,
      remarks: remarks,
      nextAdvisory: nextAdvisory,
      polygons: polygons,
      noVaExpected: noVaExp,
      vaNotIdentifiable: vaNotId,
    );
  }

  /// Normalize the advisory block text.
  ///
  /// BoM wraps long lines using `\r\r\n` followed by spaces for continuation.
  /// We need to join continuation lines back to the previous line to produce
  /// clean single-line fields for each key-value pair and section.
  String _normalizeBlock(String block) {
    // Step 1: Normalize all line endings to \n
    // BoM uses \r\r\n (double CR + LF) — handle this FIRST before \r\n
    var text = block
        .replaceAll('\r\r\n', '\n')
        .replaceAll('\r\n', '\n')
        .replaceAll('\r', '\n');

    // Step 2: Remove blank lines
    final rawLines = text.split('\n');
    final lines = rawLines.where((l) => l.trim().isNotEmpty).toList();

    // Step 3: Join continuation lines (lines starting with whitespace)
    // back to the previous line. In BoM format, continuation lines start
    // with 8+ spaces.
    final joined = <String>[];
    for (final line in lines) {
      // If the line starts with whitespace and there's a previous line,
      // it's a continuation — append to previous
      if (joined.isNotEmpty && RegExp(r'^\s{2,}').hasMatch(line)) {
        joined[joined.length - 1] += ' ${line.trim()}';
      } else {
        joined.add(line.trim());
      }
    }

    // Step 4: Normalize multiple spaces to single space within each line
    final normalized = joined
        .map((l) => l.replaceAll(RegExp(r' {2,}'), ' ').trim())
        .where((l) => l.isNotEmpty)
        .toList();

    return normalized.join('\n');
  }

  /// Extract a simple key: value field from the text.
  String? _extractField(String text, String key) {
    // Match "KEY: value" possibly spanning multiple lines
    final pattern = RegExp(
      '^$key:\\s*(.+?)(?=\\n[A-Z][A-Z ]*:|\\n(?:OBS|EST|FCST)\\s|\\n=|\$)',
      multiLine: true,
      dotAll: true,
    );
    final match = pattern.firstMatch(text);
    if (match == null) return null;

    return match.group(1)?.replaceAll('\n', ' ').replaceAll(RegExp(r'\s+'), ' ').trim();
  }

  /// Extract a section's content (e.g. OBS VA CLD, FCST VA CLD +6 HR).
  ///
  /// Returns the content after the section header, up to the next section
  /// header or end of block.
  String? _extractSection(String text, String sectionPattern) {
    final pattern = RegExp(
      '$sectionPattern\\s*(.*?)(?=\\n(?:OBS|EST|FCST)\\s|\\nRMK:|\\nNXT |\\n=|\$)',
      multiLine: true,
      dotAll: true,
    );
    final match = pattern.firstMatch(text);
    if (match == null) return null;

    final content = match.group(1)?.replaceAll('\n', ' ').trim();
    if (content == null || content.isEmpty) return null;

    return content;
  }

  /// Parse a polygon section into one or more [AshPolygon]s.
  ///
  /// A single section like OBS VA CLD can contain multiple sub-polygons
  /// at different flight levels, e.g.:
  /// `SFC/FL200 S0459 E10658 - ... MOV E 10KT SFC/FL500 S0714 E10625 - ... MOV W 30KT`
  List<AshPolygon> _parsePolygonSection(String section, PolygonType type, DateTime contextDtg) {
    // Check for NO VA EXP or VA NOT IDENTIFIABLE
    if (section.contains('NO VA EXP') || section.contains('NOT AVBL') ||
        section.contains('VA NOT IDENTIFIABLE') || section.contains('NOT OBSD')) {
      return [AshPolygon(
        type: type,
        coordinates: [],
        baseFlightLevel: null,
        topFlightLevel: null,
      )];
    }

    // Split the section into sub-polygons by flight level tokens.
    // Each sub-polygon starts with a flight level like SFC/FL060 or FL050/FL100.
    final flPattern = RegExp(r'(?=(SFC|FL\d+)\s*/\s*(SFC|FL\d+))');
    final flMatches = flPattern.allMatches(section).toList();

    if (flMatches.isEmpty) {
      // No flight level found; try to parse entire section as one polygon
      final coords = parsePolygonCoordinates(section);
      if (coords.isEmpty) return [];

      final movMatch = RegExp(r'MOV\s+([A-Z]+)\s+(\d+)\s*KT').firstMatch(section);
      return [AshPolygon(
        type: type,
        coordinates: coords,
        baseFlightLevel: null,
        topFlightLevel: null,
        movementDirection: movMatch?.group(1),
        movementSpeed: movMatch != null ? '${movMatch.group(2)} KT' : null,
      )];
    }

    // Extract valid time for forecast sections
    DateTime? validTime;
    final timeMatch = RegExp(r'(\d{2}/\d{4})Z').firstMatch(section);
    if (timeMatch != null && type != PolygonType.observed && type != PolygonType.estimated) {
      validTime = parseForecastDtg('${timeMatch.group(1)}Z', contextDtg);
    }

    final results = <AshPolygon>[];

    for (int i = 0; i < flMatches.length; i++) {
      final start = flMatches[i].start;
      final end = i + 1 < flMatches.length ? flMatches[i + 1].start : section.length;
      final subSection = section.substring(start, end).trim();

      // Extract flight level from this sub-section
      final flMatch = RegExp(r'(SFC|FL\d+)\s*/\s*(SFC|FL\d+)').firstMatch(subSection);
      final baseFL = flMatch?.group(1);
      final topFL = flMatch?.group(2);

      // Extract movement info
      final movMatch = RegExp(r'MOV\s+([A-Z]+)\s+(\d+)\s*KT').firstMatch(subSection);
      final movDir = movMatch?.group(1);
      final movSpd = movMatch != null ? '${movMatch.group(2)} KT' : null;

      // Extract coordinates
      final coords = parsePolygonCoordinates(subSection);

      results.add(AshPolygon(
        type: type,
        coordinates: coords,
        validTime: validTime,
        baseFlightLevel: baseFL,
        topFlightLevel: topFL,
        movementDirection: movDir,
        movementSpeed: movSpd,
      ));
    }

    return results;
  }
}
