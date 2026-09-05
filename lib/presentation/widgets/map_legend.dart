import 'package:flutter/material.dart';
import 'package:ashwatch/data/models/volcano_advisory.dart';
import 'package:ashwatch/presentation/widgets/ash_polygon_layer.dart';

/// Compact floating map legend showing polygon type colors.
class MapLegend extends StatelessWidget {
  final List<VolcanoAdvisory> advisories;

  const MapLegend({super.key, required this.advisories});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: isDark
            ? const Color(0xFF141B2D).withValues(alpha: 0.92)
            : Colors.white.withValues(alpha: 0.92),
        borderRadius: BorderRadius.circular(10),
        border: isDark
            ? Border.all(color: const Color(0x26FFFFFF), width: 0.5)
            : null,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.08),
            blurRadius: 8,
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'ASH LAYERS',
            style: TextStyle(
              color: isDark
                  ? const Color(0x80FFFFFF)
                  : const Color(0xFF1A1A2E).withValues(alpha: 0.4),
              fontSize: 9,
              fontWeight: FontWeight.w600,
              letterSpacing: 1.5,
            ),
          ),
          const SizedBox(height: 6),
          _legendItem('Observed', observedOpacity, isDark),
          const SizedBox(height: 3),
          _legendItem('Forecast +6h', forecast6hOpacity, isDark),
          const SizedBox(height: 3),
          _legendItem('Forecast +12h', forecast12hOpacity, isDark),
          const SizedBox(height: 3),
          _legendItem('Forecast +18h', forecast18hOpacity, isDark),
        ],
      ),
    );
  }

  Widget _legendItem(String label, double opacity, bool isDark) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 14,
          height: 14,
          decoration: BoxDecoration(
            color: const Color(0xFFE53E3E).withValues(alpha: opacity),
            borderRadius: BorderRadius.circular(3),
            border: Border.all(
              color: const Color(0xFFE53E3E).withValues(alpha: (opacity + 0.15).clamp(0, 1)),
              width: 0.5,
            ),
          ),
        ),
        const SizedBox(width: 8),
        Text(
          label,
          style: TextStyle(
            color: isDark
                ? const Color(0xCCFFFFFF)
                : const Color(0xFF1A1A2E).withValues(alpha: 0.7),
            fontSize: 11,
            fontWeight: FontWeight.w400,
          ),
        ),
      ],
    );
  }
}
