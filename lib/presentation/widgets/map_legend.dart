import 'package:flutter/material.dart';
import 'package:ashwatch/data/models/volcano_advisory.dart';
import 'package:ashwatch/presentation/widgets/ash_polygon_layer.dart';

/// Compact floating map legend showing polygon type colors.
class MapLegend extends StatelessWidget {
  final List<VolcanoAdvisory> advisories;

  const MapLegend({super.key, required this.advisories});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xE6141B2D),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0x33FFFFFF), width: 0.5),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'ASH LAYERS',
            style: TextStyle(
              color: Color(0x99FFFFFF),
              fontSize: 9,
              fontWeight: FontWeight.w600,
              letterSpacing: 1.5,
            ),
          ),
          const SizedBox(height: 6),
          _legendItem('Observed', observedOpacity, context),
          const SizedBox(height: 3),
          _legendItem('Forecast +6h', forecast6hOpacity, context),
          const SizedBox(height: 3),
          _legendItem('Forecast +12h', forecast12hOpacity, context),
          const SizedBox(height: 3),
          _legendItem('Forecast +18h', forecast18hOpacity, context),
        ],
      ),
    );
  }

  Widget _legendItem(String label, double opacity, BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 14,
          height: 14,
          decoration: BoxDecoration(
            color: const Color(0xFFFF6B35).withValues(alpha: opacity),
            borderRadius: BorderRadius.circular(3),
            border: Border.all(
              color: const Color(0xFFFF6B35).withValues(alpha: opacity + 0.1),
              width: 0.5,
            ),
          ),
        ),
        const SizedBox(width: 8),
        Text(
          label,
          style: const TextStyle(
            color: Color(0xCCFFFFFF),
            fontSize: 11,
            fontWeight: FontWeight.w400,
          ),
        ),
      ],
    );
  }
}
