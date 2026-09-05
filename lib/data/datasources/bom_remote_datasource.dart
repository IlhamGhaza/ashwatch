import 'package:http/http.dart' as http;

/// Remote data source for fetching volcanic ash advisory data from BoM.
class BomRemoteDatasource {
  static const String _baseUrl =
      'https://www.bom.gov.au/products/Volc_ash_recent.shtml';

  final http.Client _client;

  BomRemoteDatasource({http.Client? client}) : _client = client ?? http.Client();

  /// Fetches the raw HTML content from the BoM volcanic ash advisory page.
  ///
  /// Throws [BomFetchException] on failure.
  Future<String> fetchAdvisoryPage() async {
    try {
      final response = await _client
          .get(Uri.parse(_baseUrl))
          .timeout(const Duration(seconds: 30));

      if (response.statusCode == 200) {
        return response.body;
      } else {
        throw BomFetchException(
          'BoM server returned status ${response.statusCode}',
        );
      }
    } on BomFetchException {
      rethrow;
    } catch (e) {
      throw BomFetchException('Failed to fetch BoM data: $e');
    }
  }

  void dispose() {
    _client.close();
  }
}

/// Exception thrown when fetching from BoM fails.
class BomFetchException implements Exception {
  final String message;
  const BomFetchException(this.message);

  @override
  String toString() => 'BomFetchException: $message';
}
