import 'package:equatable/equatable.dart';
import 'package:latlong2/latlong.dart';

/// Type of ash polygon observation/forecast.
enum PolygonType {
  observed,
  estimated,
  forecast6h,
  forecast12h,
  forecast18h,
}

/// Represents a single volcanic ash polygon with metadata.
class AshPolygon extends Equatable {
  final PolygonType type;
  final List<LatLng> coordinates;
  final DateTime? validTime;
  final String? baseFlightLevel;
  final String? topFlightLevel;
  final String? movementDirection;
  final String? movementSpeed;

  const AshPolygon({
    required this.type,
    required this.coordinates,
    this.validTime,
    this.baseFlightLevel,
    this.topFlightLevel,
    this.movementDirection,
    this.movementSpeed,
  });

  bool get hasCoordinates => coordinates.isNotEmpty;

  /// Human-readable flight level range (e.g. "SFC → FL060").
  String get flightLevelDisplay {
    final base = baseFlightLevel ?? 'SFC';
    final top = topFlightLevel ?? '???';
    return '$base → $top';
  }

  /// Human-readable movement (e.g. "NW 05 KT").
  String get movementDisplay {
    if (movementDirection == null && movementSpeed == null) return 'Unknown';
    final dir = movementDirection ?? '???';
    final spd = movementSpeed ?? '???';
    return '$dir $spd';
  }

  @override
  List<Object?> get props => [
        type,
        coordinates,
        validTime,
        baseFlightLevel,
        topFlightLevel,
        movementDirection,
        movementSpeed,
      ];
}

/// Represents a complete volcanic ash advisory for one volcano.
class VolcanoAdvisory extends Equatable {
  final String volcanoName;
  final String? volcanoCode;
  final LatLng? position;
  final String area;
  final String? sourceElevation;
  final String advisoryNumber;
  final DateTime dtg;
  final String? eruptionDetails;
  final String? infoSource;
  final String? remarks;
  final String? nextAdvisory;
  final List<AshPolygon> polygons;
  final bool noVaExpected;
  final bool vaNotIdentifiable;

  const VolcanoAdvisory({
    required this.volcanoName,
    this.volcanoCode,
    this.position,
    required this.area,
    this.sourceElevation,
    required this.advisoryNumber,
    required this.dtg,
    this.eruptionDetails,
    this.infoSource,
    this.remarks,
    this.nextAdvisory,
    this.polygons = const [],
    this.noVaExpected = false,
    this.vaNotIdentifiable = false,
  });

  /// Get the observed polygon if available.
  AshPolygon? get observedPolygon => polygons
      .where((p) => p.type == PolygonType.observed || p.type == PolygonType.estimated)
      .where((p) => p.hasCoordinates)
      .firstOrNull;

  /// Get the forecast +6h polygon if available.
  AshPolygon? get forecast6h => polygons
      .where((p) => p.type == PolygonType.forecast6h)
      .where((p) => p.hasCoordinates)
      .firstOrNull;

  /// Get the forecast +12h polygon if available.
  AshPolygon? get forecast12h => polygons
      .where((p) => p.type == PolygonType.forecast12h)
      .where((p) => p.hasCoordinates)
      .firstOrNull;

  /// Get the forecast +18h polygon if available.
  AshPolygon? get forecast18h => polygons
      .where((p) => p.type == PolygonType.forecast18h)
      .where((p) => p.hasCoordinates)
      .firstOrNull;

  /// Get the primary flight level display from the observed/first polygon.
  String get primaryFlightLevel {
    final primary = observedPolygon ?? polygons.firstOrNull;
    return primary?.flightLevelDisplay ?? 'N/A';
  }

  /// Get the primary movement display.
  String get primaryMovement {
    final primary = observedPolygon ?? polygons.firstOrNull;
    return primary?.movementDisplay ?? 'Unknown';
  }

  /// Summary of which polygon sections are present.
  String get polygonSummary {
    final parts = <String>[];
    if (observedPolygon != null) parts.add('Observed');
    if (forecast6h != null) parts.add('+6h');
    if (forecast12h != null) parts.add('+12h');
    if (forecast18h != null) parts.add('+18h');
    if (noVaExpected) return 'No VA Expected';
    if (vaNotIdentifiable) return 'VA Not Identifiable';
    if (parts.isEmpty) return 'No polygons';
    return parts.join(' · ');
  }

  /// Get all polygons that have coordinates.
  List<AshPolygon> get activePolygons =>
      polygons.where((p) => p.hasCoordinates).toList();

  /// Get all LatLng coordinates across all polygons for bounds calculation.
  List<LatLng> get allCoordinates =>
      activePolygons.expand((p) => p.coordinates).toList();

  @override
  List<Object?> get props => [
        volcanoName,
        volcanoCode,
        position,
        area,
        sourceElevation,
        advisoryNumber,
        dtg,
        eruptionDetails,
        infoSource,
        remarks,
        nextAdvisory,
        polygons,
        noVaExpected,
        vaNotIdentifiable,
      ];
}
