import 'package:ashwatch/core/parser/html_extractor.dart';
import 'package:ashwatch/core/parser/vaa_parser.dart';
import 'package:ashwatch/data/datasources/bom_remote_datasource.dart';
import 'package:ashwatch/data/models/volcano_advisory.dart';
import 'package:ashwatch/domain/repositories/vaa_repository.dart';

/// Implementation of [VaaRepository] that fetches from BoM and parses
/// the advisory text.
class VaaRepositoryImpl implements VaaRepository {
  final BomRemoteDatasource _datasource;
  final VaaParser _parser;

  VaaRepositoryImpl({
    BomRemoteDatasource? datasource,
    VaaParser? parser,
  })  : _datasource = datasource ?? BomRemoteDatasource(),
        _parser = parser ?? VaaParser();

  @override
  Future<List<VolcanoAdvisory>> getActiveAdvisories() async {
    // 1. Fetch raw HTML
    final html = await _datasource.fetchAdvisoryPage();

    // 2. Extract text from <pre> tags
    final textContent = extractPreContent(html);
    final decodedContent = decodeHtmlEntities(textContent);

    // 3. Parse all Indonesian advisories
    final allAdvisories = _parser.parse(decodedContent, areaFilter: 'INDONESIA');

    // 4. Deduplicate by volcano (keep newest for each)
    final activeAdvisories = _parser.deduplicateByVolcano(allAdvisories);

    // 5. Sort by volcano name for consistent ordering
    activeAdvisories.sort((a, b) => a.volcanoName.compareTo(b.volcanoName));

    return activeAdvisories;
  }
}
