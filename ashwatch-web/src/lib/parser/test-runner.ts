import { parseAviationComponent, parseAviationCoordinate, parsePolygonCoordinates } from './coordinate-parser';
import { parseDtg, parseForecastDtg } from './date-utils';
import { vaaParser } from './vaa-parser';
import { SINGLE_ADVISORY_FIXTURE, MULTIPLE_ADVISORIES_FIXTURE } from '../fixtures';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('--- Testing Coordinate Parser ---');
// Latitude: S0816 -> -8.2667
const sLat = parseAviationComponent('S0816');
assert(sLat !== null, 'S0816 should parse');
assert(Math.abs(sLat! - -8.2667) < 0.001, `S0816 should be approx -8.2667, got ${sLat}`);

// Longitude: E12330 -> 123.5000
const eLon = parseAviationComponent('E12330');
assert(eLon !== null, 'E12330 should parse');
assert(Math.abs(eLon! - 123.5) < 0.001, `E12330 should be 123.5, got ${eLon}`);

// Coordinate pair: S0816 E12330
const coord = parseAviationCoordinate('S0816 E12330');
assert(coord !== null, 'Pair should parse');
assert(Math.abs(coord!.latitude - -8.2667) < 0.001, 'Latitude matches');
assert(Math.abs(coord!.longitude - 123.5) < 0.001, 'Longitude matches');

// Polygon coordinates
const polyCoords = parsePolygonCoordinates(
  'SFC/FL060 S0819 E12332 - S0811 E12246 - S0746 E12244 - S0746 E12335 - S0819 E12332 MOV NW 05KT'
);
assert(polyCoords.length === 5, `Expected 5 polygon coords, got ${polyCoords.length}`);

console.log('✓ Coordinate parser tests passed!');

console.log('--- Testing Date Utils ---');
const dtg = parseDtg('20260904/1400Z');
assert(dtg !== null, 'DTG should parse');
assert(dtg!.getUTCFullYear() === 2026, 'Year matches');
assert(dtg!.getUTCMonth() === 8, 'Month matches (September)');
assert(dtg!.getUTCDate() === 4, 'Day matches');
assert(dtg!.getUTCHours() === 14, 'Hour matches');

const fcstDtg = parseForecastDtg('04/1940Z', dtg!);
assert(fcstDtg !== null, 'Forecast DTG should parse');
assert(fcstDtg!.getUTCHours() === 19 && fcstDtg!.getUTCMinutes() === 40, 'Time matches');

console.log('✓ Date parser tests passed!');

console.log('--- Testing VAA Parser Single Advisory ---');
const singleResult = vaaParser.parse(SINGLE_ADVISORY_FIXTURE);
assert(singleResult.length === 1, `Expected 1 advisory, got ${singleResult.length}`);
const lewotolok = singleResult[0];
assert(lewotolok.volcanoName === 'LEWOTOLOK', `Volcano name: ${lewotolok.volcanoName}`);
assert(lewotolok.advisoryNumber === '2026/192', `Advisory number: ${lewotolok.advisoryNumber}`);
assert(lewotolok.polygons.length === 4, `Expected 4 polygon sections, got ${lewotolok.polygons.length}`);
assert(lewotolok.polygons[0].type === 'observed', 'First polygon is observed');
assert(lewotolok.polygons[0].topFlightLevel === 'FL060', 'Flight level FL060');
assert(lewotolok.polygons[0].movementDirection === 'NW', 'Movement dir NW');

console.log('✓ Single advisory test passed!');

console.log('--- Testing VAA Parser Multiple Advisories & Deduplication ---');
const multiResult = vaaParser.parse(MULTIPLE_ADVISORIES_FIXTURE);
assert(multiResult.length === 5, `Expected 5 advisories, got ${multiResult.length}`);

const deduplicated = vaaParser.deduplicateByVolcano(multiResult);
assert(deduplicated.length === 5, `Expected 5 unique volcanoes, got ${deduplicated.length}`);

const krakatau = multiResult.find((a) => a.volcanoName === 'KRAKATAU');
assert(krakatau !== undefined, 'Krakatau should be found in multiResult');
console.log('Krakatau polygons count:', krakatau!.polygons.length);
krakatau!.polygons.forEach((p) => {
  console.log(`  - [${p.type}] FL: ${p.baseFlightLevel}/${p.topFlightLevel}, Mov: ${p.movementDirection} ${p.movementSpeed || ''}, Coords: ${p.coordinates.length}`);
});
assert(krakatau!.polygons.length >= 2, 'Krakatau should have multiple polygons');

console.log('✓ Multiple advisories test passed!');

console.log('--- Testing Geo Checker (Point-in-Polygon & Distance) ---');
import { isPointInPolygon, checkLocationAshStatus } from '../geo-checker';
import { formatFlightLevelHuman, formatMovementHuman } from '../aviation-format';

// Test simple square polygon around Krakatau coordinates
const testPoly = [
  { latitude: -6.0, longitude: 105.3 },
  { latitude: -6.0, longitude: 105.6 },
  { latitude: -6.2, longitude: 105.6 },
  { latitude: -6.2, longitude: 105.3 },
];

assert(isPointInPolygon({ latitude: -6.1, longitude: 105.42 }, testPoly), 'Point should be inside polygon');
assert(!isPointInPolygon({ latitude: -7.0, longitude: 107.0 }, testPoly), 'Point should be outside polygon');

// Test checkLocationAshStatus with Krakatau advisory
const insideResult = checkLocationAshStatus(
  { latitude: -6.1, longitude: 105.42 },
  multiResult,
  'Krakatau Vicinity'
);
assert(insideResult.status === 'ASH_AREA' || insideResult.status === 'FORECAST_OVERLAP', 'Should detect ash area');
console.log(`  - Location check inside plume: ${insideResult.statusLabel} (${insideResult.affectedVolcano})`);

const outsideResult = checkLocationAshStatus(
  { latitude: 3.59, longitude: 98.67 },
  multiResult,
  'Medan City'
);
assert(outsideResult.status === 'CLEAR', 'Medan should be CLEAR');
assert(outsideResult.nearestAshDistanceKm > 0, 'Distance to nearest ash should be > 0 km');
console.log(`  - Location check outside plume (Medan): ${outsideResult.statusLabel} (${outsideResult.nearestAshDistanceKm} km from nearest ash)`);

// Test Aviation Format
assert(formatFlightLevelHuman('FL150').includes('15,000 ft'), 'FL150 format failed');
assert(formatMovementHuman('MOV NW 05KT').includes('Northwest'), 'Movement NW format failed');
console.log('✓ Geo Checker and Aviation Format tests passed!');

console.log('🎉 ALL TESTS PASSED SUCCESSFULLY!');

