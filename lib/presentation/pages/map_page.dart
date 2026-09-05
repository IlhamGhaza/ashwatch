import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_map/flutter_map.dart';
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

  @override
  void initState() {
    super.initState();
    context.read<DarwinVaaBloc>().add(const LoadAdvisories());
  }

  @override
  void dispose() {
    _sheetController.dispose();
    super.dispose();
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
      backgroundColor: const Color(0xFF0D1117),
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
        backgroundColor: const Color(0xFF0D1117),
        interactionOptions: const InteractionOptions(
          flags: InteractiveFlag.all,
        ),
      ),
      children: [
        // OSM tile layer
        TileLayer(
          urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          userAgentPackageName: 'com.ashwatch.app',
          tileBuilder: (context, widget, tile) {
            return ColorFiltered(
              colorFilter: const ColorFilter.matrix([
                0.3, 0, 0, 0, 0,    // R
                0, 0.3, 0, 0, 0,    // G
                0, 0, 0.4, 0, 0,    // B
                0, 0, 0, 1, 0,      // A
              ]),
              child: widget,
            );
          },
        ),

        // Ash polygons
        if (advisories.isNotEmpty)
          PolygonLayer(polygons: buildAshPolygons(advisories)),

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
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Color(0xE60D1117),
              Color(0xCC0D1117),
              Color(0x000D1117),
            ],
          ),
        ),
        child: Row(
          children: [
            // Title
            const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Volcanic Ash',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                Text(
                  'Darwin VAAC',
                  style: TextStyle(
                    color: Color(0x80FFFFFF),
                    fontSize: 12,
                    fontWeight: FontWeight.w400,
                  ),
                ),
              ],
            ),
            const Spacer(),
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
          decoration: const BoxDecoration(
            color: Color(0xF2141B2D),
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
            border: Border(
              top: BorderSide(color: Color(0x1AFFFFFF), width: 0.5),
            ),
          ),
          child: _buildSheetContent(advisories, lastUpdated, scrollController),
        );
      },
    );
  }

  Widget _buildSidePanel(List<VolcanoAdvisory> advisories, DateTime lastUpdated) {
    return Container(
      decoration: const BoxDecoration(
        color: Color(0xF2141B2D),
        border: Border(
          left: BorderSide(color: Color(0x1AFFFFFF), width: 0.5),
        ),
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
                color: const Color(0x33FFFFFF),
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
              style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
            const Spacer(),
            Text(
              '$updatedStr UTC',
              style: const TextStyle(
                color: Color(0x66FFFFFF),
                fontSize: 11,
                fontFamily: 'monospace',
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        const Text(
          'Source: Bureau of Meteorology — Darwin VAAC',
          style: TextStyle(
            color: Color(0x4DFFFFFF),
            fontSize: 10,
          ),
        ),
        const SizedBox(height: 12),
        const Divider(color: Color(0x1AFFFFFF), height: 1),
        const SizedBox(height: 8),

        // Volcano list
        ...advisories.map((advisory) => Padding(
              padding: const EdgeInsets.only(bottom: 2),
              child: VolcanoListTile(
                advisory: advisory,
                onTap: () => AdvisoryDetailSheet.show(context, advisory),
              ),
            )),
      ],
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
    return IconButton(
      onPressed: isLoading ? null : onPressed,
      icon: isLoading
          ? const SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: Color(0x80FFFFFF),
              ),
            )
          : const Icon(Icons.refresh, color: Color(0xCCFFFFFF), size: 22),
      style: IconButton.styleFrom(
        backgroundColor: const Color(0x1AFFFFFF),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
        ),
      ),
    );
  }
}

/// Loading indicator overlay.
class _LoadingIndicator extends StatelessWidget {
  const _LoadingIndicator();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xCC141B2D),
        borderRadius: BorderRadius.circular(16),
      ),
      child: const Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          CircularProgressIndicator(
            strokeWidth: 2.5,
            color: Color(0xFFFF6B35),
          ),
          SizedBox(height: 16),
          Text(
            'Loading Advisories',
            style: TextStyle(
              color: Color(0xCCFFFFFF),
              fontSize: 13,
              fontWeight: FontWeight.w500,
            ),
          ),
          SizedBox(height: 4),
          Text(
            'Fetching from Darwin VAAC…',
            style: TextStyle(
              color: Color(0x66FFFFFF),
              fontSize: 11,
            ),
          ),
        ],
      ),
    );
  }
}
