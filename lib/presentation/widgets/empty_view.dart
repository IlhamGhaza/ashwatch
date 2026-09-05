import 'package:flutter/material.dart';

/// Empty state view when no active Indonesian advisories are found.
class EmptyView extends StatelessWidget {
  final VoidCallback onRefresh;

  const EmptyView({super.key, required this.onRefresh});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.check_circle_outline,
              color: Color(0xFF48BB78),
              size: 48,
            ),
            const SizedBox(height: 16),
            const Text(
              'No Active Advisories',
              style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'No Indonesian volcanic ash advisories are\ncurrently active in the Darwin VAAC.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Color(0x80FFFFFF),
                fontSize: 13,
              ),
            ),
            const SizedBox(height: 24),
            OutlinedButton.icon(
              onPressed: onRefresh,
              icon: const Icon(Icons.refresh, size: 18),
              label: const Text('Check Again'),
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color(0xCCFFFFFF),
                side: const BorderSide(color: Color(0x33FFFFFF)),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
