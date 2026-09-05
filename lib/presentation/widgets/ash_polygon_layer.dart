import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:ashwatch/data/models/volcano_advisory.dart';

/// Opacity constants for different polygon types — matching reference
/// visualization with clear, visible ash spread areas.
const double observedOpacity = 0.55;
const double forecast6hOpacity = 0.40;
const double forecast12hOpacity = 0.28;
const double forecast18hOpacity = 0.18;

/// A curated palette of red/warm tones for volcanic ash visualization.
/// Inspired by aviation ash advisory charts that use red/pink/orange tones.
const List<Color> _volcanoPalette = [
  Color(0xFFE53E3E), // red
  Color(0xFFDD6B20), // dark orange
  Color(0xFFD53F8C), // pink
  Color(0xFFC53030), // dark red
  Color(0xFFE25353), // coral red
  Color(0xFFB83280), // magenta
  Color(0xFFED6436), // burnt orange
  Color(0xFFCB3A5F), // rose
  Color(0xFFD44A4A), // crimson
  Color(0xFFE2683C), // tangerine
];

/// Get a deterministic color for a volcano based on its name.
Color getVolcanoColor(String volcanoName) {
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
///
/// Polygons are drawn with prominent red/pink fill like aviation ash charts,
/// with decreasing opacity for longer forecast horizons.
List<Polygon> buildAshPolygons(List<VolcanoAdvisory> advisories) {
  final polygons = <Polygon>[];

  for (final advisory in advisories) {
    final baseColor = getVolcanoColor(advisory.volcanoName);

    // Draw forecast polygons first (below), then observed on top
    final sortedPolygons = List<AshPolygon>.from(advisory.activePolygons)
      ..sort((a, b) {
        const order = {
          PolygonType.forecast18h: 0,
          PolygonType.forecast12h: 1,
          PolygonType.forecast6h: 2,
          PolygonType.estimated: 3,
          PolygonType.observed: 4,
        };
        return (order[a.type] ?? 0).compareTo(order[b.type] ?? 0);
      });

    for (final ashPoly in sortedPolygons) {
      if (ashPoly.coordinates.length < 3) continue;

      final opacity = getPolygonOpacity(ashPoly.type);

      // Informative aviation label: FL and movement (e.g. FL500 W 30KT)
      String? label;
      if (ashPoly.type == PolygonType.observed || ashPoly.type == PolygonType.estimated) {
        final fl = ashPoly.topFlightLevel ?? ashPoly.flightLevelDisplay;
        final mov = ashPoly.movementDirection != null && ashPoly.movementSpeed != null
            ? '${ashPoly.movementDirection} ${ashPoly.movementSpeed}'
            : (ashPoly.movementDirection ?? '');
        if (fl.isNotEmpty && mov.isNotEmpty) {
          label = '$fl\n$mov';
        } else if (fl.isNotEmpty) {
          label = fl;
        } else {
          label = advisory.volcanoName;
        }
      }

      polygons.add(Polygon(
        points: ashPoly.coordinates,
        color: baseColor.withValues(alpha: opacity),
        borderColor: baseColor.withValues(alpha: (opacity + 0.35).clamp(0.0, 1.0)),
        borderStrokeWidth: 2.0,
        label: label,
        labelStyle: TextStyle(
          color: Colors.white.withValues(alpha: 0.95),
          fontSize: 11,
          fontWeight: FontWeight.w800,
          shadows: const [
            Shadow(color: Colors.black87, blurRadius: 4),
          ],
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
      width: 140,
      height: 44,
      child: GestureDetector(
        onTap: () => onTap?.call(advisory),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(3),
              decoration: BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: color.withValues(alpha: 0.5),
                    blurRadius: 8,
                    spreadRadius: 2,
                  ),
                ],
              ),
              child: Icon(
                Icons.volcano,
                color: color,
                size: 16,
              ),
            ),
            const SizedBox(height: 2),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.9),
                borderRadius: BorderRadius.circular(4),
                boxShadow: const [
                  BoxShadow(
                    color: Colors.black26,
                    blurRadius: 3,
                  ),
                ],
              ),
              child: Text(
                advisory.volcanoName,
                style: TextStyle(
                  color: color,
                  fontSize: 9,
                  fontWeight: FontWeight.w700,
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
