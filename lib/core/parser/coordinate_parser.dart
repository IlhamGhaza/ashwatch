import 'package:latlong2/latlong.dart';

/// Parses a single aviation-format coordinate string (e.g. "N0148", "S0806",
/// "E12750", "W154057") into a decimal degree value.
///
/// Latitude format: [N|S]DDMM  (degrees + minutes)
/// Longitude format: [E|W]DDDMM (degrees + minutes)
///
/// Returns `null` if the string cannot be parsed.
double? parseAviationComponent(String raw) {
  final trimmed = raw.trim().toUpperCase();
  if (trimmed.isEmpty) return null;

  final prefix = trimmed[0];
  final digits = trimmed.substring(1);

  if (digits.isEmpty) return null;

  final isNegative = prefix == 'S' || prefix == 'W';
  final isLatitude = prefix == 'N' || prefix == 'S';
  final isLongitude = prefix == 'E' || prefix == 'W';

  if (!isLatitude && !isLongitude) return null;

  int degreeDigits;
  if (isLatitude) {
    degreeDigits = 2; // DDMM
  } else {
    degreeDigits = 3; // DDDMM
  }

  if (digits.length < degreeDigits + 2) return null;

  final degreePart = int.tryParse(digits.substring(0, degreeDigits));
  final minutePart = int.tryParse(digits.substring(degreeDigits, degreeDigits + 2));

  if (degreePart == null || minutePart == null) return null;
  if (minutePart < 0 || minutePart >= 60) return null;

  double decimal = degreePart + (minutePart / 60.0);
  if (isNegative) decimal = -decimal;

  return double.parse(decimal.toStringAsFixed(4));
}

/// Parses a coordinate pair string like "S0816 E12330" or "N0148 E12750"
/// into a [LatLng].
///
/// Returns `null` if the pair cannot be parsed.
LatLng? parseAviationCoordinate(String pair) {
  final parts = pair.trim().split(RegExp(r'\s+'));
  if (parts.length < 2) return null;

  final lat = parseAviationComponent(parts[0]);
  final lon = parseAviationComponent(parts[1]);

  if (lat == null || lon == null) return null;

  return LatLng(lat, lon);
}

/// Extracts all coordinate pairs from a line of text.
///
/// Coordinate pairs are separated by " - ". Stops parsing when it encounters
/// movement info like "MOV" which should not be treated as coordinates.
List<LatLng> parsePolygonCoordinates(String text) {
  final coords = <LatLng>[];

  // Remove flight level prefix (e.g. "SFC/FL060" or "FL050/FL100")
  String cleaned = text.replaceAll(RegExp(r'(SFC|FL\d+)\s*/\s*(SFC|FL\d+)\s*'), '').trim();

  // Remove timestamp prefix for forecast sections (e.g. "04/1940Z")
  cleaned = cleaned.replaceAll(RegExp(r'^\d{2}/\d{4}Z\s*'), '').trim();

  // Stop at MOV to avoid interpreting movement info as coordinates
  final movIndex = cleaned.indexOf(RegExp(r'\bMOV\b'));
  if (movIndex >= 0) {
    cleaned = cleaned.substring(0, movIndex).trim();
  }

  // Split on " - " separators
  final segments = cleaned.split(RegExp(r'\s*-\s*'));

  for (final segment in segments) {
    final trimmed = segment.trim();
    if (trimmed.isEmpty) continue;

    final coord = parseAviationCoordinate(trimmed);
    if (coord != null) {
      coords.add(coord);
    }
  }

  return coords;
}
