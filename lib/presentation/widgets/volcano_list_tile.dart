import 'package:flutter/material.dart';
import 'package:ashwatch/data/models/volcano_advisory.dart';
import 'package:ashwatch/presentation/widgets/ash_polygon_layer.dart';

/// A list tile widget for displaying a volcano advisory summary.
class VolcanoListTile extends StatelessWidget {
  final VolcanoAdvisory advisory;
  final VoidCallback? onTap;

  const VolcanoListTile({
    super.key,
    required this.advisory,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final color = getVolcanoColor(advisory.volcanoName);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            border: Border(
              left: BorderSide(color: color, width: 3),
            ),
          ),
          child: Row(
            children: [
              // Color indicator dot
              Container(
                width: 10,
                height: 10,
                decoration: BoxDecoration(
                  color: color,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: color.withValues(alpha: 0.4),
                      blurRadius: 6,
                      spreadRadius: 1,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              // Volcano info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      advisory.volcanoName,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Row(
                      children: [
                        _tag(advisory.primaryFlightLevel),
                        const SizedBox(width: 6),
                        Flexible(
                          child: Text(
                            advisory.polygonSummary,
                            style: const TextStyle(
                              color: Color(0x99FFFFFF),
                              fontSize: 11,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const Icon(
                Icons.chevron_right,
                color: Color(0x66FFFFFF),
                size: 20,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _tag(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: const Color(0x1AFFFFFF),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        text,
        style: const TextStyle(
          color: Color(0xCCFFFFFF),
          fontSize: 10,
          fontWeight: FontWeight.w500,
          fontFamily: 'monospace',
        ),
      ),
    );
  }
}
