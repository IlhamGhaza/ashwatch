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

  group('Multi-polygon layer parsing (e.g. Krakatau)', () {
    const krakatauFixture = '''
VA ADVISORY
DTG: 20260905/2230Z
VAAC: DARWIN
VOLCANO: KRAKATAU 262000
PSN: S0606 E10525
AREA: INDONESIA
SOURCE ELEV: 155M AMSL
ADVISORY NR: 2026/182
INFO SOURCE: HIMAWARI-9 CVGHM
ERUPTION DETAILS: VA TO FL500 MOV W, VA TO FL200 MOV E
OBS VA DTG: 05/2210Z
OBS VA CLD: SFC/FL200 S0459 E10658 - S0641 E11009 - S0904
        E10916 - S0959 E10501 - S0728 E10149 MOV E 10KT SFC/FL500
        S0714 E10625 - S1033 E10020 - S1705 E09640 - S1204 E08003 -
        S0226 E08747 - S0023 E10020 - S0500 E10658 MOV W 30KT
FCST VA CLD +6 HR: 06/0410Z SFC/FL200 S0504 E10700 - S0641
        E11007 - S0901 E10914 - S1000 E10501 - S0728 E10147
        SFC/FL500 S0714 E10617 - S1031 E10025 - S1842 E09718 - S1303
        E07717 - S0259 E08536 - S0023 E10020 - S0504 E10700
FCST VA CLD +12 HR: 06/1010Z SFC/FL200 S0502 E10654 - S0644
        E11005 - S0903 E10916 - S0957 E10501 - S0731 E10150
        SFC/FL500 S0717 E10625 - S1038 E10020 - S1916 E09618 - S1441
        E07646 - S0245 E08536 - S0023 E10020 - S0500 E10658
FCST VA CLD +18 HR: 06/1610Z SFC/FL200 S0459 E10657 - S0642
        E11009 - S0905 E10917 - S0959 E10500 - S0727 E10145
        SFC/FL500 S0715 E10622 - S1028 E10025 - S2051 E09556 - S1601
        E07454 - S0245 E08419 - S0025 E10023 - S0504 E10702
RMK: HIGH LEVEL VA TO FL500 MOV W AND CONTINUOUS VA TO FL200 MOV E.
NXT ADVISORY: NO LATER THAN 20260906/0030Z=
''';

    test('extracts multiple sub-polygons per section for Krakatau', () {
      final advisories = parser.parse(krakatauFixture);
      expect(advisories.length, equals(1));

      final krakatau = advisories.first;
      expect(krakatau.volcanoName, equals('KRAKATAU'));
      expect(krakatau.advisoryNumber, equals('2026/182'));

      // Total 8 polygons (2 observed + 2 each for +6h, +12h, +18h)
      expect(krakatau.polygons.length, equals(8));
      expect(krakatau.activePolygons.length, equals(8));

      // Check observed polygons
      final obs = krakatau.polygons.where((p) => p.type == PolygonType.observed).toList();
      expect(obs.length, equals(2));

      // Layer 1: SFC/FL200 MOV E 10KT
      expect(obs[0].topFlightLevel, equals('FL200'));
      expect(obs[0].movementDirection, equals('E'));
      expect(obs[0].movementSpeed, equals('10 KT'));
      expect(obs[0].coordinates.length, equals(5));

      // Layer 2: SFC/FL500 MOV W 30KT
      expect(obs[1].topFlightLevel, equals('FL500'));
      expect(obs[1].movementDirection, equals('W'));
      expect(obs[1].movementSpeed, equals('30 KT'));
      expect(obs[1].coordinates.length, equals(7));
    });
  });
}
