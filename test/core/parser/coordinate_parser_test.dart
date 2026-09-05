import 'package:flutter_test/flutter_test.dart';
import 'package:ashwatch/core/parser/coordinate_parser.dart';

void main() {
  group('parseAviationComponent', () {
    test('parses N coordinate correctly', () {
      // N0148 = 1 degree, 48 minutes = 1.8000
      expect(parseAviationComponent('N0148'), closeTo(1.8000, 0.001));
    });

    test('parses S coordinate correctly', () {
      // S0806 = -8 degrees, 6 minutes = -8.1000
      expect(parseAviationComponent('S0806'), closeTo(-8.1000, 0.001));
    });

    test('parses E coordinate correctly', () {
      // E12750 = 127 degrees, 50 minutes = 127.8333
      expect(parseAviationComponent('E12750'), closeTo(127.8333, 0.001));
    });

    test('parses W coordinate correctly', () {
      // W15405 = -154 degrees, 5 minutes = -154.0833
      expect(parseAviationComponent('W15405'), closeTo(-154.0833, 0.001));
    });

    test('parses N0310 correctly', () {
      // N0310 = 3 degrees, 10 minutes = 3.1667
      expect(parseAviationComponent('N0310'), closeTo(3.1667, 0.001));
    });

    test('parses E09824 correctly', () {
      // E09824 = 98 degrees, 24 minutes = 98.4000
      expect(parseAviationComponent('E09824'), closeTo(98.4000, 0.001));
    });

    test('parses S0816 correctly', () {
      expect(parseAviationComponent('S0816'), closeTo(-8.2667, 0.001));
    });

    test('parses E12330 correctly', () {
      expect(parseAviationComponent('E12330'), closeTo(123.5000, 0.001));
    });

    test('returns null for empty string', () {
      expect(parseAviationComponent(''), isNull);
    });

    test('returns null for invalid prefix', () {
      expect(parseAviationComponent('X1234'), isNull);
    });

    test('returns null for too-short string', () {
      expect(parseAviationComponent('N1'), isNull);
    });

    test('handles case insensitivity', () {
      expect(parseAviationComponent('n0148'), closeTo(1.8000, 0.001));
      expect(parseAviationComponent('s0806'), closeTo(-8.1000, 0.001));
    });

    test('handles whitespace', () {
      expect(parseAviationComponent('  N0148  '), closeTo(1.8000, 0.001));
    });
  });

  group('parseAviationCoordinate', () {
    test('parses N/E coordinate pair', () {
      final result = parseAviationCoordinate('N0148 E12750');
      expect(result, isNotNull);
      expect(result!.latitude, closeTo(1.8000, 0.001));
      expect(result.longitude, closeTo(127.8333, 0.001));
    });

    test('parses S/E coordinate pair', () {
      final result = parseAviationCoordinate('S0806 E11255');
      expect(result, isNotNull);
      expect(result!.latitude, closeTo(-8.1000, 0.001));
      expect(result.longitude, closeTo(112.9167, 0.001));
    });

    test('parses N/E pair with extra spaces', () {
      final result = parseAviationCoordinate('  N0310   E09824  ');
      expect(result, isNotNull);
      expect(result!.latitude, closeTo(3.1667, 0.001));
      expect(result.longitude, closeTo(98.4000, 0.001));
    });

    test('returns null for single component', () {
      expect(parseAviationCoordinate('N0148'), isNull);
    });

    test('returns null for empty string', () {
      expect(parseAviationCoordinate(''), isNull);
    });
  });

  group('parsePolygonCoordinates', () {
    test('extracts polygon coordinates from OBS VA CLD line', () {
      const line = 'SFC/FL050 S0606 E10530 - S0629 E10511 - S0631 E10444 - S0604 E10441 - S0600 E10527 MOV SW 05KT';
      final coords = parsePolygonCoordinates(line);

      expect(coords.length, equals(5));
      expect(coords[0].latitude, closeTo(-6.1000, 0.001));
      expect(coords[0].longitude, closeTo(105.5000, 0.001));
      expect(coords[1].latitude, closeTo(-6.4833, 0.001));
      expect(coords[1].longitude, closeTo(105.1833, 0.001));
    });

    test('ignores MOV info and does not treat it as coordinates', () {
      const line = 'SFC/FL060 S0819 E12332 - S0811 E12246 MOV NW 05KT';
      final coords = parsePolygonCoordinates(line);

      expect(coords.length, equals(2));
    });

    test('handles forecast section with timestamp', () {
      const line = '04/1940Z SFC/FL060 S0830 E12310 - S0810 E12220 - S0730 E12220 - S0730 E12340 - S0830 E12310';
      final coords = parsePolygonCoordinates(line);

      expect(coords.length, equals(5));
    });

    test('returns empty list for empty input', () {
      expect(parsePolygonCoordinates(''), isEmpty);
    });

    test('returns empty list for NO VA EXP', () {
      expect(parsePolygonCoordinates('NO VA EXP'), isEmpty);
    });

    test('extracts FL values correctly from section', () {
      const line = 'SFC/FL060 S0819 E12332 MOV NW 05KT';
      final coords = parsePolygonCoordinates(line);
      expect(coords.length, equals(1));
    });
  });
}
