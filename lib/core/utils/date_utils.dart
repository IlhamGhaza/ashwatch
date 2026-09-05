/// Utility for parsing date/time formats used in BoM VAA products.
///
/// All DateTime values are stored in UTC.
library;

/// Parses a DTG string like "20260904/1400Z" into a UTC [DateTime].
///
/// Returns `null` if the format is invalid.
DateTime? parseDtg(String raw) {
  final trimmed = raw.trim().toUpperCase().replaceAll('Z', '');
  // Format: YYYYMMDD/HHMM or YYMMDD/HHMM
  final match = RegExp(r'^(\d{6,8})/(\d{4})$').firstMatch(trimmed);
  if (match == null) return null;

  final datePart = match.group(1)!;
  final timePart = match.group(2)!;

  int year, month, day;

  if (datePart.length == 8) {
    year = int.tryParse(datePart.substring(0, 4)) ?? 0;
    month = int.tryParse(datePart.substring(4, 6)) ?? 0;
    day = int.tryParse(datePart.substring(6, 8)) ?? 0;
  } else if (datePart.length == 6) {
    // YYMMDD - prefix with century
    final yy = int.tryParse(datePart.substring(0, 2)) ?? 0;
    year = 2000 + yy;
    month = int.tryParse(datePart.substring(2, 4)) ?? 0;
    day = int.tryParse(datePart.substring(4, 6)) ?? 0;
  } else {
    return null;
  }

  final hour = int.tryParse(timePart.substring(0, 2)) ?? 0;
  final minute = int.tryParse(timePart.substring(2, 4)) ?? 0;

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

  return DateTime.utc(year, month, day, hour, minute);
}

/// Parses a short forecast DTG like "04/1940Z" using the advisory DTG
/// for year/month context.
///
/// The [contextDtg] provides the year and month reference. If the forecast
/// day is less than the context day, it may be the next month.
DateTime? parseForecastDtg(String raw, DateTime contextDtg) {
  final trimmed = raw.trim().toUpperCase().replaceAll('Z', '');
  final match = RegExp(r'^(\d{2})/(\d{4})$').firstMatch(trimmed);
  if (match == null) return null;

  final day = int.tryParse(match.group(1)!) ?? 0;
  final timePart = match.group(2)!;
  final hour = int.tryParse(timePart.substring(0, 2)) ?? 0;
  final minute = int.tryParse(timePart.substring(2, 4)) ?? 0;

  if (day < 1 || day > 31) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

  int year = contextDtg.year;
  int month = contextDtg.month;

  // If forecast day < context day, it might roll over to next month
  if (day < contextDtg.day) {
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }

  return DateTime.utc(year, month, day, hour, minute);
}
