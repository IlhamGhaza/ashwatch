import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:geolocator/geolocator.dart';
import 'package:intl/intl.dart';
import 'package:latlong2/latlong.dart';
import 'package:ashwatch/data/models/volcano_advisory.dart';
import 'package:ashwatch/presentation/blocs/darwin_vaa_bloc.dart';
import 'package:ashwatch/presentation/widgets/advisory_detail_sheet.dart';
import 'package:ashwatch/presentation/widgets/ash_polygon_layer.dart';
import 'package:ashwatch/presentation/widgets/empty_view.dart';
import 'package:ashwatch/presentation/widgets/error_view.dart';
import 'package:ashwatch/presentation/widgets/map_legend.dart';
import 'package:ashwatch/presentation/widgets/volcano_list_tile.dart';

/// Indonesia default bounds for map fallback.
final _indonesiaBounds = LatLngBounds(
  const LatLng(-11.0, 95.0),
  const LatLng(6.0, 141.0),
);

/// Main map page displaying volcanic ash advisories.
class MapPage extends StatefulWidget {
  const MapPage({super.key});

  @override
  State<MapPage> createState() => _MapPageState();
}

class _MapPageState extends State<MapPage> {
  final MapController _mapController = MapController();
  final DraggableScrollableController _sheetController = DraggableScrollableController();

  // User location state
  LatLng? _userLocation;
  StreamSubscription<Position>? _positionSubscription;
  bool _locationPermissionDenied = false;

  @override
  void initState() {
    super.initState();
    context.read<DarwinVaaBloc>().add(const LoadAdvisories());
    _initLocation();
  }

  @override
  void dispose() {
    _positionSubscription?.cancel();
    _sheetController.dispose();
    super.dispose();
  }

  /// Initialize user location with full permission handling.
  ///
  /// Supports Android below 12 and above 12 via the geolocator package
  /// which handles runtime permission requests internally.
  Future<void> _initLocation() async {
    try {
      // Check if location services are enabled
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        // Location services not enabled, skip
        return;
      }

      // Check and request permission
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          setState(() => _locationPermissionDenied = true);
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        setState(() => _locationPermissionDenied = true);
        return;
      }

      // Get initial position
      try {
        final position = await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.medium,
            timeLimit: Duration(seconds: 10),
          ),
        );
        if (mounted) {
          setState(() {
            _userLocation = LatLng(position.latitude, position.longitude);
          });
        }
      } catch (_) {
        // Timeout or error getting initial position, continue anyway
      }

      // Listen for position updates
      _positionSubscription = Geolocator.getPositionStream(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.medium,
          distanceFilter: 50, // Update every 50 meters
        ),
      ).listen(
        (Position position) {
          if (mounted) {
            setState(() {
              _userLocation = LatLng(position.latitude, position.longitude);
            });
          }
        },
        onError: (_) {
          // Ignore location stream errors
        },
      );
    } catch (_) {
      // Location initialization failed, continue without it
    }
  }

  void _fitMapToAdvisories(List<VolcanoAdvisory> advisories) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      try {
        final allCoords = advisories
            .expand((a) => a.allCoordinates)
            .toList();

        // Also include volcano positions
        for (final a in advisories) {
          if (a.position != null) allCoords.add(a.position!);
        }

        if (allCoords.isEmpty) {
          _mapController.fitCamera(CameraFit.bounds(
            bounds: _indonesiaBounds,
            padding: const EdgeInsets.all(40),
          ));
          return;
        }

        double minLat = allCoords.first.latitude;
        double maxLat = allCoords.first.latitude;
        double minLng = allCoords.first.longitude;
        double maxLng = allCoords.first.longitude;

        for (final c in allCoords) {
          if (c.latitude < minLat) minLat = c.latitude;
          if (c.latitude > maxLat) maxLat = c.latitude;
          if (c.longitude < minLng) minLng = c.longitude;
          if (c.longitude > maxLng) maxLng = c.longitude;
        }

        _mapController.fitCamera(CameraFit.bounds(
          bounds: LatLngBounds(
            LatLng(minLat, minLng),
            LatLng(maxLat, maxLng),
          ),
          padding: const EdgeInsets.fromLTRB(50, 100, 50, 200),
        ));
      } catch (_) {
        // Ignore if map isn't ready yet
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      body: BlocConsumer<DarwinVaaBloc, DarwinVaaState>(
        listener: (context, state) {
          if (state is DarwinVaaSuccess) {
            _fitMapToAdvisories(state.advisories);
          }
        },
        builder: (context, state) {
          return Stack(
            children: [
              // Map layer (always visible)
              _buildMap(state),

              // Top status bar
              _buildTopBar(state),

              // Legend (bottom-left)
              if (state is DarwinVaaSuccess)
                Positioned(
                  left: 12,
                  bottom: _bottomSheetMinHeight(context) + 12,
                  child: MapLegend(advisories: state.advisories),
                ),

              // Loading overlay
              if (state is DarwinVaaLoading)
                const Positioned.fill(
                  child: Center(
                    child: _LoadingIndicator(),
                  ),
                ),

              // Error overlay
              if (state is DarwinVaaError)
                Positioned.fill(
                  child: ErrorView(
                    message: state.message,
                    onRetry: () => context.read<DarwinVaaBloc>().add(const LoadAdvisories()),
                  ),
                ),

              // Empty overlay
              if (state is DarwinVaaEmpty)
                Positioned.fill(
                  child: EmptyView(
                    onRefresh: () => context.read<DarwinVaaBloc>().add(const LoadAdvisories()),
                  ),
                ),

              // Bottom sheet with volcano list
              if (state is DarwinVaaSuccess)
                _buildBottomSheet(state.advisories, state.lastUpdated),
            ],
          );
        },
      ),
    );
  }

  Widget _buildMap(DarwinVaaState state) {
    final advisories = state is DarwinVaaSuccess ? state.advisories : <VolcanoAdvisory>[];

    return FlutterMap(
      mapController: _mapController,
      options: MapOptions(
        initialCenter: const LatLng(-2.5, 118.0), // Center of Indonesia
        initialZoom: 5,
        minZoom: 3,
        maxZoom: 14,
        backgroundColor: const Color(0xFFE8E0D8),
        interactionOptions: const InteractionOptions(
          flags: InteractiveFlag.all,
        ),
      ),
      children: [
        // OSM tile layer — normal bright tiles (no dark filter)
        TileLayer(
          urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          userAgentPackageName: 'com.ashwatch.app',
        ),

        // Ash polygons
        if (advisories.isNotEmpty)
          PolygonLayer(polygons: buildAshPolygons(advisories)),

        // User location marker
        if (_userLocation != null)
          MarkerLayer(
            markers: [
              Marker(
                point: _userLocation!,
                width: 28,
                height: 28,
                child: const _UserLocationMarker(),
              ),
            ],
          ),

        // Volcano markers
        if (advisories.isNotEmpty)
          MarkerLayer(
            markers: buildVolcanoMarkers(
              advisories,
              onTap: (advisory) => AdvisoryDetailSheet.show(context, advisory),
            ),
          ),
      ],
    );
  }

  Widget _buildTopBar(DarwinVaaState state) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Positioned(
      top: 0,
      left: 0,
      right: 0,
      child: Container(
        padding: EdgeInsets.fromLTRB(
          16,
          MediaQuery.of(context).padding.top + 8,
          16,
          10,
        ),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: isDark
                ? [
                    const Color(0xFF0D1117).withValues(alpha: 0.95),
                    const Color(0xFF0D1117).withValues(alpha: 0.8),
                    Colors.transparent,
                  ]
                : [
                    Colors.white.withValues(alpha: 0.95),
                    Colors.white.withValues(alpha: 0.85),
                    Colors.white.withValues(alpha: 0.0),
                  ],
          ),
        ),
        child: Row(
          children: [
            // Title
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Volcanic Ash',
                  style: TextStyle(
                    color: isDark ? Colors.white : const Color(0xFF1A1A2E),
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                Text(
                  'Darwin VAAC',
                  style: TextStyle(
                    color: isDark
                        ? const Color(0x99FFFFFF)
                        : const Color(0xFF1A1A2E).withValues(alpha: 0.5),
                    fontSize: 12,
                    fontWeight: FontWeight.w400,
                  ),
                ),
              ],
            ),
            const Spacer(),
            // My location button
            _LocationButton(
              hasLocation: _userLocation != null,
              denied: _locationPermissionDenied,
              onPressed: () {
                if (_userLocation != null) {
                  _mapController.move(_userLocation!, 10);
                } else if (_locationPermissionDenied) {
                  Geolocator.openAppSettings();
                } else {
                  _initLocation();
                }
              },
            ),
            const SizedBox(width: 8),
            // Refresh button
            _RefreshButton(
              isLoading: state is DarwinVaaLoading,
              onPressed: () => context.read<DarwinVaaBloc>().add(const RefreshAdvisories()),
            ),
          ],
        ),
      ),
    );
  }

  double _bottomSheetMinHeight(BuildContext context) {
    return MediaQuery.of(context).size.height * 0.15;
  }

  Widget _buildBottomSheet(List<VolcanoAdvisory> advisories, DateTime lastUpdated) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isLandscape = MediaQuery.of(context).orientation == Orientation.landscape;

    if (isLandscape) {
      return Positioned(
        right: 0,
        top: 0,
        bottom: 0,
        width: 320,
        child: _buildSidePanel(advisories, lastUpdated),
      );
    }

    return DraggableScrollableSheet(
      controller: _sheetController,
      initialChildSize: 0.18,
      minChildSize: 0.10,
      maxChildSize: 0.55,
      snap: true,
      snapSizes: const [0.18, 0.4, 0.55],
      builder: (context, scrollController) {
        return Container(
          decoration: BoxDecoration(
            color: isDark
                ? const Color(0xFF141B2D).withValues(alpha: 0.97)
                : Colors.white.withValues(alpha: 0.97),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            border: isDark
                ? const Border(top: BorderSide(color: Color(0x26FFFFFF), width: 0.5))
                : null,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: isDark ? 0.35 : 0.1),
                blurRadius: 20,
                offset: const Offset(0, -4),
              ),
            ],
          ),
          child: _buildSheetContent(advisories, lastUpdated, scrollController),
        );
      },
    );
  }

  Widget _buildSidePanel(List<VolcanoAdvisory> advisories, DateTime lastUpdated) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      decoration: BoxDecoration(
        color: isDark
            ? const Color(0xFF141B2D).withValues(alpha: 0.97)
            : Colors.white.withValues(alpha: 0.97),
        border: isDark
            ? const Border(left: BorderSide(color: Color(0x26FFFFFF), width: 0.5))
            : null,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.35 : 0.1),
            blurRadius: 10,
            offset: const Offset(-2, 0),
          ),
        ],
      ),
      child: SafeArea(
        child: _buildSheetContent(advisories, lastUpdated, null),
      ),
    );
  }

  Widget _buildSheetContent(
    List<VolcanoAdvisory> advisories,
    DateTime lastUpdated,
    ScrollController? scrollController,
  ) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final updatedStr = DateFormat('HH:mm').format(lastUpdated);

    return ListView(
      controller: scrollController,
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      children: [
        if (scrollController != null) ...[
          // Drag handle
          Center(
            child: Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: isDark ? const Color(0x33FFFFFF) : const Color(0x33000000),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 12),
        ],

        // Header
        Row(
          children: [
            Text(
              'Active Advisories: ${advisories.length}',
              style: TextStyle(
                color: isDark ? Colors.white : const Color(0xFF1A1A2E),
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
            const Spacer(),
            Text(
              '$updatedStr UTC',
              style: TextStyle(
                color: isDark
                    ? const Color(0x66FFFFFF)
                    : const Color(0xFF1A1A2E).withValues(alpha: 0.4),
                fontSize: 11,
                fontFamily: 'monospace',
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          'Source: Bureau of Meteorology — Darwin VAAC',
          style: TextStyle(
            color: isDark
                ? const Color(0x4DFFFFFF)
                : const Color(0xFF1A1A2E).withValues(alpha: 0.35),
            fontSize: 10,
          ),
        ),
        const SizedBox(height: 12),
        Divider(
          color: isDark ? const Color(0x1AFFFFFF) : Colors.black.withValues(alpha: 0.08),
          height: 1,
        ),
        const SizedBox(height: 8),

        // Volcano list
        ...advisories.map((advisory) => Padding(
              padding: const EdgeInsets.only(bottom: 2),
              child: VolcanoListTile(
                advisory: advisory,
                onTap: () {
                  if (advisory.position != null) {
                    _mapController.move(advisory.position!, 7.5);
                  }
                  AdvisoryDetailSheet.show(context, advisory);
                },
              ),
            )),
      ],
    );
  }
}

/// Animated user location marker with pulsing blue dot.
class _UserLocationMarker extends StatefulWidget {
  const _UserLocationMarker();

  @override
  State<_UserLocationMarker> createState() => _UserLocationMarkerState();
}

class _UserLocationMarkerState extends State<_UserLocationMarker>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    )..repeat();
    _pulseAnimation = Tween<double>(begin: 0.4, end: 0.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _pulseAnimation,
      builder: (context, child) {
        return Stack(
          alignment: Alignment.center,
          children: [
            // Pulse ring
            Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFF4285F4).withValues(alpha: _pulseAnimation.value),
              ),
            ),
            // Blue dot
            Container(
              width: 14,
              height: 14,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFF4285F4),
                border: Border.all(color: Colors.white, width: 2.5),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x404285F4),
                    blurRadius: 6,
                    spreadRadius: 1,
                  ),
                ],
              ),
            ),
          ],
        );
      },
    );
  }
}

/// Location button.
class _LocationButton extends StatelessWidget {
  final bool hasLocation;
  final bool denied;
  final VoidCallback onPressed;

  const _LocationButton({
    required this.hasLocation,
    required this.denied,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return IconButton(
      onPressed: onPressed,
      icon: Icon(
        hasLocation
            ? Icons.my_location
            : (denied ? Icons.location_disabled : Icons.location_searching),
        color: hasLocation
            ? const Color(0xFF4285F4)
            : (isDark ? const Color(0x99FFFFFF) : const Color(0xFF666666)),
        size: 20,
      ),
      style: IconButton.styleFrom(
        backgroundColor: isDark
            ? const Color(0xFF141B2D).withValues(alpha: 0.9)
            : Colors.white.withValues(alpha: 0.9),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
          side: isDark
              ? const BorderSide(color: Color(0x26FFFFFF), width: 0.5)
              : BorderSide.none,
        ),
        shadowColor: Colors.black26,
        elevation: 2,
      ),
    );
  }
}

/// Refresh button with loading animation.
class _RefreshButton extends StatelessWidget {
  final bool isLoading;
  final VoidCallback onPressed;

  const _RefreshButton({required this.isLoading, required this.onPressed});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return IconButton(
      onPressed: isLoading ? null : onPressed,
      icon: isLoading
          ? SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: isDark ? const Color(0x80FFFFFF) : const Color(0xFF666666),
              ),
            )
          : Icon(
              Icons.refresh,
              color: isDark ? const Color(0xCCFFFFFF) : const Color(0xFF444444),
              size: 22,
            ),
      style: IconButton.styleFrom(
        backgroundColor: isDark
            ? const Color(0xFF141B2D).withValues(alpha: 0.9)
            : Colors.white.withValues(alpha: 0.9),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
          side: isDark
              ? const BorderSide(color: Color(0x26FFFFFF), width: 0.5)
              : BorderSide.none,
        ),
        shadowColor: Colors.black26,
        elevation: 2,
      ),
    );
  }
}

/// Loading indicator overlay.
class _LoadingIndicator extends StatelessWidget {
  const _LoadingIndicator();

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: isDark
            ? const Color(0xCC141B2D)
            : Colors.white.withValues(alpha: 0.9),
        borderRadius: BorderRadius.circular(16),
        border: isDark
            ? Border.all(color: const Color(0x1AFFFFFF), width: 0.5)
            : null,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.4 : 0.1),
            blurRadius: 20,
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const CircularProgressIndicator(
            strokeWidth: 2.5,
            color: Color(0xFFE53E3E),
          ),
          const SizedBox(height: 16),
          Text(
            'Loading Advisories',
            style: TextStyle(
              color: isDark ? Colors.white : const Color(0xFF1A1A2E),
              fontSize: 13,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Fetching from Darwin VAAC…',
            style: TextStyle(
              color: isDark ? const Color(0x66FFFFFF) : const Color(0xFF888888),
              fontSize: 11,
            ),
          ),
        ],
      ),
    );
  }
}
