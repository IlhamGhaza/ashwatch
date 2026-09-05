import 'package:ashwatch/data/models/volcano_advisory.dart';
import 'package:ashwatch/domain/repositories/vaa_repository.dart';

/// Use case for fetching currently active Indonesian volcanic ash advisories.
class GetActiveAdvisories {
  final VaaRepository _repository;

  const GetActiveAdvisories(this._repository);

  /// Execute the use case.
  ///
  /// Returns the latest advisory for each active Indonesian volcano.
  Future<List<VolcanoAdvisory>> call() async {
    return _repository.getActiveAdvisories();
  }
}
