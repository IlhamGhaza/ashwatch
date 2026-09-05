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
    final color = getVolcanoColor(advisory.volcanoName);
    final dtgFormatted = DateFormat('dd MMM yyyy HH:mm').format(advisory.dtg);

    return DraggableScrollableSheet(
      initialChildSize: 0.55,
      minChildSize: 0.3,
      maxChildSize: 0.85,
      builder: (context, scrollController) {
        return Container(
          decoration: const BoxDecoration(
            color: Color(0xFF141B2D),
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
            border: Border(
              top: BorderSide(color: Color(0x33FFFFFF), width: 0.5),
            ),
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
                    color: const Color(0x33FFFFFF),
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
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  if (advisory.volcanoCode != null)
                    _codeBadge(advisory.volcanoCode!),
                ],
              ),
              const SizedBox(height: 20),

              // Key details grid
              _detailRow('Advisory', advisory.advisoryNumber),
              _detailRow('Issued', '$dtgFormatted UTC'),
              if (advisory.infoSource != null)
                _detailRow('Source', advisory.infoSource!),
              if (advisory.sourceElevation != null)
                _detailRow('Elevation', advisory.sourceElevation!),
              _detailRow('Ash', advisory.primaryFlightLevel),
              _detailRow('Movement', advisory.primaryMovement),
              if (advisory.eruptionDetails != null)
                _detailRow('Eruption', advisory.eruptionDetails!),
              if (advisory.remarks != null)
                _detailRow('Remarks', advisory.remarks!),
              if (advisory.nextAdvisory != null)
                _detailRow('Next Advisory', advisory.nextAdvisory!),

              const SizedBox(height: 20),
              const Divider(color: Color(0x1AFFFFFF)),
              const SizedBox(height: 12),

              // Ash cloud sections
              const Text(
                'ASH CLOUD SECTIONS',
                style: TextStyle(
                  color: Color(0x99FFFFFF),
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 1.2,
                ),
              ),
              const SizedBox(height: 12),

              if (advisory.noVaExpected)
                _statusMessage('No volcanic ash expected.', Icons.check_circle_outline, Colors.greenAccent)
              else if (advisory.vaNotIdentifiable)
                _statusMessage('Volcanic ash not identifiable from satellite data.', Icons.help_outline, Colors.amberAccent)
              else ...[
                _polygonSection('Observed', advisory.observedPolygon, color),
                _polygonSection('Forecast +6h', advisory.forecast6h, color),
                _polygonSection('Forecast +12h', advisory.forecast12h, color),
                _polygonSection('Forecast +18h', advisory.forecast18h, color),
              ],
            ],
          ),
        );
      },
    );
  }

  Widget _codeBadge(String code) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0x1AFFFFFF),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        code,
        style: const TextStyle(
          color: Color(0xCCFFFFFF),
          fontSize: 11,
          fontWeight: FontWeight.w500,
          fontFamily: 'monospace',
        ),
      ),
    );
  }

  Widget _detailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: const TextStyle(
                color: Color(0x80FFFFFF),
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 13,
                fontWeight: FontWeight.w400,
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
              style: TextStyle(color: color, fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }

  Widget _polygonSection(String label, AshPolygon? polygon, Color color) {
    final hasData = polygon != null && polygon.hasCoordinates;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: hasData ? color.withValues(alpha: 0.08) : const Color(0x08FFFFFF),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: hasData ? color.withValues(alpha: 0.2) : const Color(0x0DFFFFFF),
        ),
      ),
      child: Row(
        children: [
          Icon(
            hasData ? Icons.cloud : Icons.cloud_off,
            color: hasData ? color : const Color(0x4DFFFFFF),
            size: 18,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    color: hasData ? Colors.white : const Color(0x66FFFFFF),
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                if (hasData && polygon.flightLevelDisplay.isNotEmpty)
                  Text(
                    '${polygon.flightLevelDisplay}  •  ${polygon.movementDisplay}',
                    style: const TextStyle(
                      color: Color(0x80FFFFFF),
                      fontSize: 11,
                    ),
                  ),
              ],
            ),
          ),
          Icon(
            hasData ? Icons.check_circle : Icons.remove_circle_outline,
            color: hasData ? const Color(0xFF48BB78) : const Color(0x33FFFFFF),
            size: 16,
          ),
        ],
      ),
    );
  }
}
