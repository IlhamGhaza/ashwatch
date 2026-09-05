import 'package:ashwatch/data/models/volcano_advisory.dart';

/// Abstract repository interface for volcanic ash advisories.
abstract class VaaRepository {
  /// Fetches all currently active Indonesian volcanic ash advisories.
  ///
  /// Returns the latest advisory for each unique Indonesian volcano.
  Future<List<VolcanoAdvisory>> getActiveAdvisories();
}
