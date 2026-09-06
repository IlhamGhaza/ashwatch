import { AshPolygon, PolygonType, VolcanoAdvisory } from '../types';
import { parseAviationCoordinate, parsePolygonCoordinates } from './coordinate-parser';
import { parseDtg, parseForecastDtg } from './date-utils';

export class VaaParser {
  /**
   * Parse the raw text content (already extracted from HTML) into advisories.
   * By default filters for advisories where AREA includes areaFilter (INDONESIA).
   */
  parse(text: string, areaFilter = 'INDONESIA'): VolcanoAdvisory[] {
    const advisories: VolcanoAdvisory[] = [];
    const blocks = this.splitAdvisoryBlocks(text);

    for (const block of blocks) {
      try {
        const advisory = this.parseAdvisoryBlock(block);
        if (
          advisory &&
          advisory.area.toUpperCase().includes(areaFilter.toUpperCase())
        ) {
          advisories.push(advisory);
        }
      } catch (err) {
        console.warn('VaaParser: Failed to parse advisory block:', err);
      }
    }

    return advisories;
  }

  /**
   * Deduplicate advisories by volcano name, keeping only the newest
   * advisory (by DTG) for each volcano.
   */
  deduplicateByVolcano(advisories: VolcanoAdvisory[]): VolcanoAdvisory[] {
    const byVolcano = new Map<string, VolcanoAdvisory>();

    for (const adv of advisories) {
      const key = adv.volcanoName.toUpperCase();
      const existing = byVolcano.get(key);

      if (!existing || new Date(adv.dtg) > new Date(existing.dtg)) {
        byVolcano.set(key, adv);
      }
    }

    return Array.from(byVolcano.values());
  }

  /**
   * Split the full text into individual VA ADVISORY blocks.
   */
  splitAdvisoryBlocks(text: string): string[] {
    const blocks: string[] = [];
    const parts = text.split(/(?=VA ADVISORY\b)/g);

    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.startsWith('VA ADVISORY')) {
        blocks.push(trimmed);
      }
    }

    return blocks;
  }

  /**
   * Parse a single VA ADVISORY block into a VolcanoAdvisory object.
   */
  parseAdvisoryBlock(block: string): VolcanoAdvisory | null {
    const normalized = this.normalizeBlock(block);

    const dtgStr = this.extractField(normalized, 'DTG');
    const volcanoStr = this.extractField(normalized, 'VOLCANO');
    const psnStr = this.extractField(normalized, 'PSN');
    const area = this.extractField(normalized, 'AREA');
    const sourceElev = this.extractField(normalized, 'SOURCE ELEV');
    const advisoryNr = this.extractField(normalized, 'ADVISORY NR');
    const infoSource = this.extractField(normalized, 'INFO SOURCE');
    const eruptionDetails = this.extractField(normalized, 'ERUPTION DETAILS');
    const remarks = this.extractField(normalized, 'RMK');
    const nextAdvisory = this.extractField(normalized, 'NXT ADVISORY');

    if (!dtgStr || !volcanoStr || !area || !advisoryNr) {
      return null;
    }

    const dtgDate = parseDtg(dtgStr);
    if (!dtgDate) return null;

    // Parse volcano name and code
    const volcanoMatch = /^(.+?)\s+(\d{5,6})\s*$/.exec(volcanoStr.trim());
    const volcanoName = (volcanoMatch ? volcanoMatch[1] : volcanoStr).trim();
    const volcanoCode = volcanoMatch ? volcanoMatch[2] : undefined;

    // Parse position
    const position = psnStr ? parseAviationCoordinate(psnStr) : null;

    // Check for negative observations
    const noVaExp = normalized.includes('NO VA EXP');
    const vaNotId = normalized.includes('VA NOT IDENTIFIABLE');

    // Parse polygon sections
    const polygons: AshPolygon[] = [];

    const obsSection = this.extractSection(normalized, 'OBS VA CLD\\s*:');
    const estSection = this.extractSection(normalized, 'EST VA CLD\\s*:');

    if (obsSection) {
      polygons.push(...this.parsePolygonSection(obsSection, 'observed', dtgDate));
    }
    if (estSection) {
      polygons.push(...this.parsePolygonSection(estSection, 'estimated', dtgDate));
    }

    const fcst6Section = this.extractSection(normalized, 'FCST VA CLD \\+6 HR\\s*:');
    if (fcst6Section) {
      polygons.push(...this.parsePolygonSection(fcst6Section, 'forecast6h', dtgDate));
    }

    const fcst12Section = this.extractSection(normalized, 'FCST VA CLD \\+12 HR\\s*:');
    if (fcst12Section) {
      polygons.push(...this.parsePolygonSection(fcst12Section, 'forecast12h', dtgDate));
    }

    const fcst18Section = this.extractSection(normalized, 'FCST VA CLD \\+18 HR\\s*:');
    if (fcst18Section) {
      polygons.push(...this.parsePolygonSection(fcst18Section, 'forecast18h', dtgDate));
    }

    // Determine primary flight level and movement
    const primaryPoly = polygons.find((p) => p.coordinates.length > 0) || polygons[0];
    const primaryFlightLevel = primaryPoly?.topFlightLevel
      ? `${primaryPoly.baseFlightLevel || 'SFC'} → ${primaryPoly.topFlightLevel}`
      : 'N/A';

    const primaryMovement = primaryPoly?.movementDirection
      ? `${primaryPoly.movementDirection} ${primaryPoly.movementSpeed || ''}`.trim()
      : 'Unknown';

    const volcanoSlug = volcanoName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const advCleanNr = advisoryNr.replace(/[^a-zA-Z0-9]/g, '-');
    const id = `${volcanoSlug}-${advCleanNr}`.toLowerCase();

    return {
      id,
      volcanoName,
      volcanoSlug,
      volcanoCode,
      position,
      area,
      sourceElevation: sourceElev,
      advisoryNumber: advisoryNr,
      dtg: dtgDate.toISOString(),
      dtgRaw: dtgStr,
      eruptionDetails,
      infoSource,
      remarks,
      nextAdvisory,
      polygons,
      noVaExpected: noVaExp,
      vaNotIdentifiable: vaNotId,
      primaryFlightLevel,
      primaryMovement,
    };
  }

  /**
   * Normalize the advisory block text.
   * BoM wraps long lines using \r\r\n followed by spaces for continuation.
   */
  normalizeBlock(block: string): string {
    let text = block
      .replace(/\r\r\n/g, '\n')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n');

    const rawLines = text.split('\n');
    const lines = rawLines.filter((l) => l.trim().length > 0);

    const joined: string[] = [];
    for (const line of lines) {
      if (joined.length > 0 && /^\s{2,}/.test(line)) {
        joined[joined.length - 1] += ` ${line.trim()}`;
      } else {
        joined.push(line.trim());
      }
    }

    return joined
      .map((l) => l.replace(/ {2,}/g, ' ').trim())
      .filter((l) => l.length > 0)
      .join('\n');
  }

  /**
   * Extract a single key: value field from the text.
   */
  extractField(text: string, key: string): string | null {
    const pattern = new RegExp(
      `^${key}:\\s*(.+?)(?=\\n[A-Z][A-Z ]*:|\\n(?:OBS|EST|FCST)\\s|\\n=|$)`,
      'ms'
    );
    const match = pattern.exec(text);
    if (!match) return null;

    return match[1]
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Extract a section's content (e.g. OBS VA CLD, FCST VA CLD +6 HR).
   */
  extractSection(text: string, sectionPattern: string): string | null {
    const pattern = new RegExp(
      `${sectionPattern}\\s*(.*?)(?=\\n(?:OBS|EST|FCST)\\s|\\nRMK:|\\nNXT |\\n=|$)`,
      'ms'
    );
    const match = pattern.exec(text);
    if (!match) return null;

    const content = match[1].replace(/\n/g, ' ').trim();
    return content || null;
  }

  /**
   * Parse a polygon section into one or more AshPolygon objects.
   */
  parsePolygonSection(
    section: string,
    type: PolygonType,
    contextDtg: Date
  ): AshPolygon[] {
    if (
      section.includes('NO VA EXP') ||
      section.includes('NOT AVBL') ||
      section.includes('VA NOT IDENTIFIABLE') ||
      section.includes('NOT OBSD')
    ) {
      return [
        {
          type,
          coordinates: [],
          baseFlightLevel: null,
          topFlightLevel: null,
        },
      ];
    }

    // Find all flight level token start indices (e.g. SFC/FL060)
    const flPattern = /(?:SFC|FL\d+)\s*\/\s*(?:SFC|FL\d+)/g;
    const flMatches: { index: number }[] = [];
    let m: RegExpExecArray | null;
    while ((m = flPattern.exec(section)) !== null) {
      flMatches.push({ index: m.index });
    }

    if (flMatches.length === 0) {
      const coords = parsePolygonCoordinates(section);
      if (coords.length === 0) return [];

      const movMatch = /MOV\s+([A-Z]+)\s+(\d+)\s*KT/.exec(section);
      return [
        {
          type,
          coordinates: coords,
          baseFlightLevel: null,
          topFlightLevel: null,
          movementDirection: movMatch ? movMatch[1] : undefined,
          movementSpeed: movMatch ? `${movMatch[2]} KT` : undefined,
        },
      ];
    }

    let validTime: string | undefined;
    const timeMatch = /(\d{2}\/\d{4})Z/.exec(section);
    if (timeMatch && type !== 'observed' && type !== 'estimated') {
      const fDate = parseForecastDtg(`${timeMatch[1]}Z`, contextDtg);
      if (fDate) validTime = fDate.toISOString();
    }

    const results: AshPolygon[] = [];

    for (let i = 0; i < flMatches.length; i++) {
      const start = flMatches[i].index;
      const end = i + 1 < flMatches.length ? flMatches[i + 1].index : section.length;
      const subSection = section.substring(start, end).trim();

      const flMatch = /(SFC|FL\d+)\s*\/\s*(SFC|FL\d+)/.exec(subSection);
      const baseFL = flMatch ? flMatch[1] : undefined;
      const topFL = flMatch ? flMatch[2] : undefined;

      const movMatch = /MOV\s+([A-Z]+)\s+(\d+)\s*KT/.exec(subSection);
      const movDir = movMatch ? movMatch[1] : undefined;
      const movSpd = movMatch ? `${movMatch[2]} KT` : undefined;

      const coords = parsePolygonCoordinates(subSection);

      results.push({
        type,
        coordinates: coords,
        validTime,
        baseFlightLevel: baseFL,
        topFlightLevel: topFL,
        movementDirection: movDir,
        movementSpeed: movSpd,
      });
    }

    return results;
  }
}

export const vaaParser = new VaaParser();
