import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:ashwatch/data/models/volcano_advisory.dart';

/// Opacity constants for different polygon types.
const double observedOpacity = 0.45;
const double forecast6hOpacity = 0.32;
const double forecast12hOpacity = 0.22;
const double forecast18hOpacity = 0.14;

/// A curated palette of visually distinct hues for volcano differentiation.
const List<Color> _volcanoPalette = [
  Color(0xFFFF6B35), // warm orange
  Color(0xFFE53E3E), // red
  Color(0xFFF6AD55), // amber
  Color(0xFFED64A6), // pink
  Color(0xFF9F7AEA), // purple
  Color(0xFF4299E1), // blue
  Color(0xFF48BB78), // green
  Color(0xFF38B2AC), // teal
  Color(0xFFECC94B), // yellow
  Color(0xFFFC8181), // light red
];

/// Get a deterministic color for a volcano based on its name.
Color getVolcanoColor(String volcanoName) {
  // Use a hash of the volcano name to pick from the palette
  final hash = volcanoName.toUpperCase().codeUnits.fold<int>(0, (h, c) => h * 31 + c);
  return _volcanoPalette[hash.abs() % _volcanoPalette.length];
}

/// Get the opacity for a given polygon type.
double getPolygonOpacity(PolygonType type) {
  switch (type) {
    case PolygonType.observed:
    case PolygonType.estimated:
      return observedOpacity;
    case PolygonType.forecast6h:
      return forecast6hOpacity;
    case PolygonType.forecast12h:
      return forecast12hOpacity;
    case PolygonType.forecast18h:
      return forecast18hOpacity;
  }
}

/// Builds all map polygon layers from a list of advisories.
List<Polygon> buildAshPolygons(List<VolcanoAdvisory> advisories) {
  final polygons = <Polygon>[];

  for (final advisory in advisories) {
    final baseColor = getVolcanoColor(advisory.volcanoName);

    for (final ashPoly in advisory.activePolygons) {
      if (ashPoly.coordinates.length < 3) continue;

      final opacity = getPolygonOpacity(ashPoly.type);

      polygons.add(Polygon(
        points: ashPoly.coordinates,
        color: baseColor.withValues(alpha: opacity),
        borderColor: baseColor.withValues(alpha: opacity + 0.2),
        borderStrokeWidth: 1.5,
        label: ashPoly.type == PolygonType.observed || ashPoly.type == PolygonType.estimated
            ? advisory.volcanoName
            : null,
        labelStyle: TextStyle(
          color: Colors.white.withValues(alpha: 0.9),
          fontSize: 10,
          fontWeight: FontWeight.w600,
        ),
      ));
    }
  }

  return polygons;
}

/// Builds volcano marker positions from advisories.
List<Marker> buildVolcanoMarkers(
  List<VolcanoAdvisory> advisories, {
  void Function(VolcanoAdvisory)? onTap,
}) {
  final markers = <Marker>[];

  for (final advisory in advisories) {
    if (advisory.position == null) continue;

    final color = getVolcanoColor(advisory.volcanoName);

    markers.add(Marker(
      point: advisory.position!,
      width: 120,
      height: 40,
      child: GestureDetector(
        onTap: () => onTap?.call(advisory),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.volcano,
              color: color,
              size: 20,
              shadows: const [
                Shadow(color: Colors.black54, blurRadius: 4),
              ],
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
              decoration: BoxDecoration(
                color: const Color(0xCC141B2D),
                borderRadius: BorderRadius.circular(3),
              ),
              child: Text(
                advisory.volcanoName,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 9,
                  fontWeight: FontWeight.w600,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    ));
  }

  return markers;
}
