import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:ashwatch/data/models/volcano_advisory.dart';
import 'package:ashwatch/presentation/widgets/ash_polygon_layer.dart';

/// Bottom sheet / modal showing detailed advisory information for a volcano.
class AdvisoryDetailSheet extends StatelessWidget {
  final VolcanoAdvisory advisory;

  const AdvisoryDetailSheet({super.key, required this.advisory});

  /// Show as a modal bottom sheet.
  static void show(BuildContext context, VolcanoAdvisory advisory) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => AdvisoryDetailSheet(advisory: advisory),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final color = getVolcanoColor(advisory.volcanoName);
    final dtgFormatted = DateFormat('dd MMM yyyy HH:mm').format(advisory.dtg);

    return DraggableScrollableSheet(
      initialChildSize: 0.55,
      minChildSize: 0.3,
      maxChildSize: 0.85,
      builder: (context, scrollController) {
        return Container(
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF141B2D) : Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            border: isDark
                ? const Border(top: BorderSide(color: Color(0x26FFFFFF), width: 0.5))
                : null,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: isDark ? 0.4 : 0.15),
                blurRadius: 20,
                offset: const Offset(0, -4),
              ),
            ],
          ),
          child: ListView(
            controller: scrollController,
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
            children: [
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
              const SizedBox(height: 16),

              // Volcano name
              Row(
                children: [
                  Container(
                    width: 14,
                    height: 14,
                    decoration: BoxDecoration(
                      color: color,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: color.withValues(alpha: 0.4),
                          blurRadius: 8,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      advisory.volcanoName,
                      style: TextStyle(
                        color: isDark ? Colors.white : const Color(0xFF1A1A2E),
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  if (advisory.volcanoCode != null)
                    _codeBadge(advisory.volcanoCode!, isDark),
                ],
              ),
              const SizedBox(height: 20),

              // Key details grid
              _detailRow('Advisory', advisory.advisoryNumber, isDark),
              _detailRow('Issued', '$dtgFormatted UTC', isDark),
              if (advisory.infoSource != null)
                _detailRow('Source', advisory.infoSource!, isDark),
              if (advisory.sourceElevation != null)
                _detailRow('Elevation', advisory.sourceElevation!, isDark),
              _detailRow('Ash', advisory.primaryFlightLevel, isDark),
              _detailRow('Movement', advisory.primaryMovement, isDark),
              if (advisory.eruptionDetails != null)
                _detailRow('Eruption', advisory.eruptionDetails!, isDark),
              if (advisory.remarks != null)
                _detailRow('Remarks', advisory.remarks!, isDark),
              if (advisory.nextAdvisory != null)
                _detailRow('Next Advisory', advisory.nextAdvisory!, isDark),

              const SizedBox(height: 20),
              Divider(
                color: isDark ? const Color(0x1AFFFFFF) : Colors.black.withValues(alpha: 0.08),
              ),
              const SizedBox(height: 12),

              // Ash cloud sections
              Text(
                'ASH CLOUD SECTIONS',
                style: TextStyle(
                  color: isDark ? const Color(0x99FFFFFF) : const Color(0xFF1A1A2E),
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.2,
                ),
              ),
              const SizedBox(height: 12),

              if (advisory.noVaExpected)
                _statusMessage('No volcanic ash expected.', Icons.check_circle_outline, const Color(0xFF2E7D32))
              else if (advisory.vaNotIdentifiable && advisory.activePolygons.isEmpty)
                _statusMessage('Volcanic ash not identifiable on latest satellite imagery.', Icons.help_outline, const Color(0xFFE65100))
              else if (advisory.activePolygons.isEmpty)
                _statusMessage('No polygon coordinates in this advisory.', Icons.info_outline, const Color(0xFF616161))
              else ...[
                for (final poly in advisory.activePolygons)
                  _polygonSection(
                    _getPolygonSectionTitle(poly),
                    poly,
                    color,
                    isDark,
                  ),
              ],
            ],
          ),
        );
      },
    );
  }

  String _getPolygonSectionTitle(AshPolygon poly) {
    switch (poly.type) {
      case PolygonType.observed:
        return 'Observed';
      case PolygonType.estimated:
        return 'Estimated';
      case PolygonType.forecast6h:
        return 'Forecast +6h';
      case PolygonType.forecast12h:
        return 'Forecast +12h';
      case PolygonType.forecast18h:
        return 'Forecast +18h';
    }
  }

  Widget _codeBadge(String code, bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: isDark ? const Color(0x1AFFFFFF) : const Color(0xFFF0F0F5),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(
          color: isDark ? const Color(0x1AFFFFFF) : Colors.black.withValues(alpha: 0.06),
        ),
      ),
      child: Text(
        code,
        style: TextStyle(
          color: isDark ? const Color(0xCCFFFFFF) : const Color(0xFF1A1A2E),
          fontSize: 11,
          fontWeight: FontWeight.w600,
          fontFamily: 'monospace',
        ),
      ),
    );
  }

  Widget _detailRow(String label, String value, bool isDark) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: TextStyle(
                color: isDark
                    ? const Color(0x80FFFFFF)
                    : const Color(0xFF1A1A2E).withValues(alpha: 0.5),
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                color: isDark ? Colors.white : const Color(0xFF1A1A2E),
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _statusMessage(String message, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: TextStyle(color: color, fontSize: 13, fontWeight: FontWeight.w500),
            ),
          ),
        ],
      ),
    );
  }

  Widget _polygonSection(String label, AshPolygon polygon, Color color, bool isDark) {
    final hasData = polygon.hasCoordinates;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: hasData
            ? color.withValues(alpha: isDark ? 0.12 : 0.06)
            : (isDark ? const Color(0x08FFFFFF) : const Color(0xFFF5F5F7)),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: hasData
              ? color.withValues(alpha: 0.25)
              : (isDark ? const Color(0x0DFFFFFF) : Colors.black.withValues(alpha: 0.06)),
        ),
      ),
      child: Row(
        children: [
          Icon(
            hasData ? Icons.cloud : Icons.cloud_off,
            color: hasData ? color : (isDark ? Colors.white38 : Colors.black38),
            size: 18,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      label,
                      style: TextStyle(
                        color: hasData
                            ? (isDark ? Colors.white : const Color(0xFF1A1A2E))
                            : (isDark ? const Color(0x66FFFFFF) : Colors.black45),
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    if (hasData && polygon.flightLevelDisplay.isNotEmpty) ...[
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                        decoration: BoxDecoration(
                          color: color.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(3),
                        ),
                        child: Text(
                          polygon.flightLevelDisplay,
                          style: TextStyle(
                            color: color,
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            fontFamily: 'monospace',
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
                if (hasData && polygon.movementDisplay.isNotEmpty)
                  Text(
                    'Movement: ${polygon.movementDisplay} (${polygon.coordinates.length} points)',
                    style: TextStyle(
                      color: isDark
                          ? const Color(0x80FFFFFF)
                          : const Color(0xFF1A1A2E).withValues(alpha: 0.5),
                      fontSize: 11,
                    ),
                  ),
              ],
            ),
          ),
          Icon(
            hasData ? Icons.check_circle : Icons.remove_circle_outline,
            color: hasData ? const Color(0xFF388E3C) : (isDark ? Colors.white24 : Colors.black26),
            size: 16,
          ),
        ],
      ),
    );
  }
}
