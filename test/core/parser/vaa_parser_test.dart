import 'package:flutter_test/flutter_test.dart';
import 'package:ashwatch/core/parser/vaa_parser.dart';
import 'package:ashwatch/core/parser/html_extractor.dart';
import 'package:ashwatch/data/models/volcano_advisory.dart';
import '../../fixtures/test_fixtures.dart';

void main() {
  late VaaParser parser;

  setUp(() {
    parser = VaaParser();
  });

  group('Single advisory parsing', () {
    test('parses a single Lewotolok advisory correctly', () {
      final advisories = parser.parse(singleAdvisoryFixture);

      expect(advisories.length, equals(1));
      final a = advisories.first;
      expect(a.volcanoName, equals('LEWOTOLOK'));
      expect(a.volcanoCode, equals('264230'));
      expect(a.area, equals('INDONESIA'));
      expect(a.advisoryNumber, equals('2026/192'));
      expect(a.sourceElevation, equals('1423M AMSL'));
      expect(a.infoSource, equals('HIMAWARI-9'));
      expect(a.dtg, equals(DateTime.utc(2026, 9, 4, 14, 0)));
    });

    test('parses volcano position correctly', () {
      final advisories = parser.parse(singleAdvisoryFixture);
      final a = advisories.first;

      expect(a.position, isNotNull);
      expect(a.position!.latitude, closeTo(-8.2667, 0.001));
      expect(a.position!.longitude, closeTo(123.5000, 0.001));
    });

    test('parses OBS VA CLD polygon', () {
      final advisories = parser.parse(singleAdvisoryFixture);
      final obs = advisories.first.observedPolygon;

      expect(obs, isNotNull);
      expect(obs!.coordinates.length, equals(5));
      expect(obs.type, equals(PolygonType.observed));
      expect(obs.baseFlightLevel, equals('SFC'));
      expect(obs.topFlightLevel, equals('FL060'));
      expect(obs.movementDirection, equals('NW'));
      expect(obs.movementSpeed, equals('05 KT'));
    });

    test('parses FCST +6h polygon', () {
      final advisories = parser.parse(singleAdvisoryFixture);
      final fcst6 = advisories.first.forecast6h;

      expect(fcst6, isNotNull);
      expect(fcst6!.coordinates.length, equals(5));
      expect(fcst6.type, equals(PolygonType.forecast6h));
    });

    test('parses FCST +12h polygon', () {
      final advisories = parser.parse(singleAdvisoryFixture);
      final fcst12 = advisories.first.forecast12h;

      expect(fcst12, isNotNull);
      expect(fcst12!.coordinates.length, equals(5));
      expect(fcst12.type, equals(PolygonType.forecast12h));
    });

    test('parses FCST +18h polygon', () {
      final advisories = parser.parse(singleAdvisoryFixture);
      final fcst18 = advisories.first.forecast18h;

      expect(fcst18, isNotNull);
      expect(fcst18!.coordinates.length, equals(5));
      expect(fcst18.type, equals(PolygonType.forecast18h));
    });
  });

  group('Multiple advisories', () {
    test('parses multiple Indonesian volcanoes', () {
      final advisories = parser.parse(multipleAdvisoriesFixture);

      expect(advisories.length, equals(3));

      final names = advisories.map((a) => a.volcanoName).toSet();
      expect(names, containsAll(['LEWOTOLOK', 'DUKONO', 'SEMERU']));
    });

    test('each advisory has its own data', () {
      final advisories = parser.parse(multipleAdvisoriesFixture);

      final dukono = advisories.firstWhere((a) => a.volcanoName == 'DUKONO');
      expect(dukono.advisoryNumber, equals('2026/708'));
      expect(dukono.position!.latitude, closeTo(1.6833, 0.001));
      expect(dukono.position!.longitude, closeTo(127.8833, 0.001));

      final semeru = advisories.firstWhere((a) => a.volcanoName == 'SEMERU');
      expect(semeru.advisoryNumber, equals('2026/1010'));
    });
  });

  group('Duplicate volcano advisories', () {
    test('deduplicates keeping newest advisory per volcano', () {
      final allAdvisories = parser.parse(duplicateAdvisoriesFixture);
      expect(allAdvisories.length, equals(3)); // All 3 parsed

      final deduplicated = parser.deduplicateByVolcano(allAdvisories);
      expect(deduplicated.length, equals(1)); // Only 1 unique volcano
      expect(deduplicated.first.advisoryNumber, equals('2026/1010')); // Newest
      expect(deduplicated.first.dtg, equals(DateTime.utc(2026, 9, 4, 14, 0)));
    });
  });

  group('Indonesia filtering', () {
    test('filters out non-Indonesian advisories', () {
      final advisories = parser.parse(nonIndonesianFixture, areaFilter: 'INDONESIA');
      expect(advisories, isEmpty);
    });

    test('keeps Indonesian advisories from mixed input', () {
      final advisories = parser.parse(mixedAdvisoriesFixture, areaFilter: 'INDONESIA');
      expect(advisories.length, equals(1));
      expect(advisories.first.volcanoName, equals('KRAKATAU'));
    });
  });

  group('NO VA EXP handling', () {
    test('handles VA NOT IDENTIFIABLE in OBS section', () {
      final advisories = parser.parse(noVaExpFixture);

      expect(advisories.length, equals(1));
      final a = advisories.first;
      expect(a.volcanoName, equals('SINABUNG'));

      // Observed polygon should exist but have no coordinates
      expect(a.observedPolygon, isNull); // No usable polygon
    });

    test('handles NO VA EXP in forecast sections', () {
      final advisories = parser.parse(noVaExpFixture);
      final a = advisories.first;

      // Forecasts should have no usable polygons
      expect(a.forecast6h, isNull);
      expect(a.forecast12h, isNull);
      expect(a.forecast18h, isNull);
    });

    test('handles partial NO VA EXP (observed present, forecasts not)', () {
      final advisories = parser.parse(multipleAdvisoriesFixture);
      final lewotolok = advisories.firstWhere((a) => a.volcanoName == 'LEWOTOLOK');

      // Lewotolok has observed + forecast6h but NO VA EXP for +12h and +18h
      expect(lewotolok.observedPolygon, isNotNull);
      expect(lewotolok.forecast6h, isNotNull);
      expect(lewotolok.forecast12h, isNull); // NO VA EXP
      expect(lewotolok.forecast18h, isNull); // NO VA EXP
    });
  });

  group('Malformed advisory handling', () {
    test('does not crash on malformed advisory', () {
      final advisories = parser.parse(malformedFixture);
      // Should either skip or return empty — never throw
      expect(advisories.length, lessThanOrEqualTo(1));
    });

    test('handles empty response', () {
      final advisories = parser.parse('');
      expect(advisories, isEmpty);
    });

    test('handles response with no VA ADVISORY blocks', () {
      const text = 'Some random text without any advisory blocks';
      final advisories = parser.parse(text);
      expect(advisories, isEmpty);
    });
  });

  group('FL extraction', () {
    test('extracts SFC/FL060 correctly', () {
      final advisories = parser.parse(singleAdvisoryFixture);
      final obs = advisories.first.observedPolygon!;

      expect(obs.baseFlightLevel, equals('SFC'));
      expect(obs.topFlightLevel, equals('FL060'));
    });

    test('extracts FL from Semeru (SFC/FL150)', () {
      final advisories = parser.parse(multipleAdvisoriesFixture);
      final semeru = advisories.firstWhere((a) => a.volcanoName == 'SEMERU');
      final obs = semeru.observedPolygon!;

      expect(obs.baseFlightLevel, equals('SFC'));
      expect(obs.topFlightLevel, equals('FL150'));
    });
  });

  group('MOV extraction', () {
    test('extracts movement direction and speed', () {
      final advisories = parser.parse(singleAdvisoryFixture);
      final obs = advisories.first.observedPolygon!;

      expect(obs.movementDirection, equals('NW'));
      expect(obs.movementSpeed, equals('05 KT'));
    });

    test('extracts different movement from Dukono (W 10KT)', () {
      final advisories = parser.parse(multipleAdvisoriesFixture);
      final dukono = advisories.firstWhere((a) => a.volcanoName == 'DUKONO');
      final obs = dukono.observedPolygon!;

      expect(obs.movementDirection, equals('W'));
      expect(obs.movementSpeed, equals('10 KT'));
    });
  });

  group('HTML extraction integration', () {
    test('parses advisory from HTML-wrapped content', () {
      final html = wrapInHtml(singleAdvisoryFixture);
      final textContent = extractPreContent(html);
      final decoded = decodeHtmlEntities(textContent);
      final advisories = parser.parse(decoded);

      expect(advisories.length, equals(1));
      expect(advisories.first.volcanoName, equals('LEWOTOLOK'));
    });

    test('parses multiple advisories from HTML', () {
      final html = wrapInHtml(multipleAdvisoriesFixture);
      final textContent = extractPreContent(html);
      final decoded = decodeHtmlEntities(textContent);
      final advisories = parser.parse(decoded);

      expect(advisories.length, equals(3));
    });
  });
}
