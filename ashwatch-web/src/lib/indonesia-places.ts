import { LatLng } from './types';

export interface IndonesiaPlace {
  name: string;
  type: 'city' | 'airport' | 'town';
  code?: string;
  province: string;
  coordinates: LatLng;
}

/**
 * Curated offline dataset of major Indonesian population centers and airports.
 * Provides instant, zero-latency autocomplete for "Check My Area" without needing network requests.
 */
export const INDONESIA_PLACES: IndonesiaPlace[] = [
  // Major Cities & Capitals
  { name: 'Jakarta', type: 'city', province: 'DKI Jakarta', coordinates: { latitude: -6.2088, longitude: 106.8456 } },
  { name: 'Surabaya', type: 'city', province: 'Jawa Timur', coordinates: { latitude: -7.2575, longitude: 112.7521 } },
  { name: 'Bandung', type: 'city', province: 'Jawa Barat', coordinates: { latitude: -6.9175, longitude: 107.6191 } },
  { name: 'Medan', type: 'city', province: 'Sumatera Utara', coordinates: { latitude: 3.5952, longitude: 98.6722 } },
  { name: 'Semarang', type: 'city', province: 'Jawa Tengah', coordinates: { latitude: -6.9667, longitude: 110.4167 } },
  { name: 'Makassar', type: 'city', province: 'Sulawesi Selatan', coordinates: { latitude: -5.1477, longitude: 119.4327 } },
  { name: 'Palembang', type: 'city', province: 'Sumatera Selatan', coordinates: { latitude: -2.9761, longitude: 104.7754 } },
  { name: 'Yogyakarta', type: 'city', province: 'DI Yogyakarta', coordinates: { latitude: -7.7956, longitude: 110.3695 } },
  { name: 'Denpasar', type: 'city', province: 'Bali', coordinates: { latitude: -8.6705, longitude: 115.2126 } },
  { name: 'Bandar Lampung', type: 'city', province: 'Lampung', coordinates: { latitude: -5.4500, longitude: 105.2667 } },
  { name: 'Padang', type: 'city', province: 'Sumatera Barat', coordinates: { latitude: -0.9471, longitude: 100.4172 } },
  { name: 'Malang', type: 'city', province: 'Jawa Timur', coordinates: { latitude: -7.9666, longitude: 112.6326 } },
  { name: 'Pekanbaru', type: 'city', province: 'Riau', coordinates: { latitude: 0.5071, longitude: 101.4478 } },
  { name: 'Banjarmasin', type: 'city', province: 'Kalimantan Selatan', coordinates: { latitude: -3.3194, longitude: 114.5908 } },
  { name: 'Balikpapan', type: 'city', province: 'Kalimantan Timur', coordinates: { latitude: -1.2379, longitude: 116.8289 } },
  { name: 'Pontianak', type: 'city', province: 'Kalimantan Barat', coordinates: { latitude: -0.0263, longitude: 109.3425 } },
  { name: 'Samarinda', type: 'city', province: 'Kalimantan Timur', coordinates: { latitude: -0.5022, longitude: 117.1536 } },
  { name: 'Mataram', type: 'city', province: 'Nusa Tenggara Barat', coordinates: { latitude: -8.5799, longitude: 116.0999 } },
  { name: 'Kupang', type: 'city', province: 'Nusa Tenggara Timur', coordinates: { latitude: -10.1772, longitude: 123.6070 } },
  { name: 'Manado', type: 'city', province: 'Sulawesi Utara', coordinates: { latitude: 1.4748, longitude: 124.8421 } },
  { name: 'Ambon', type: 'city', province: 'Maluku', coordinates: { latitude: -3.6547, longitude: 128.1906 } },
  { name: 'Ternate', type: 'city', province: 'Maluku Utara', coordinates: { latitude: 0.7905, longitude: 127.3820 } },
  { name: 'Jayapura', type: 'city', province: 'Papua', coordinates: { latitude: -2.5916, longitude: 140.6690 } },
  { name: 'Banda Aceh', type: 'city', province: 'Aceh', coordinates: { latitude: 5.5483, longitude: 95.3238 } },
  { name: 'Batam', type: 'city', province: 'Kepulauan Riau', coordinates: { latitude: 1.1301, longitude: 104.0529 } },
  { name: 'Solo (Surakarta)', type: 'city', province: 'Jawa Tengah', coordinates: { latitude: -7.5755, longitude: 110.8243 } },
  { name: 'Cirebon', type: 'city', province: 'Jawa Barat', coordinates: { latitude: -6.7320, longitude: 108.5523 } },
  { name: 'Banyuwangi', type: 'city', province: 'Jawa Timur', coordinates: { latitude: -8.2192, longitude: 114.3692 } },
  { name: 'Labuan Bajo', type: 'town', province: 'Nusa Tenggara Timur', coordinates: { latitude: -8.4964, longitude: 119.8877 } },
  { name: 'Ende', type: 'town', province: 'Nusa Tenggara Timur', coordinates: { latitude: -8.8432, longitude: 121.6623 } },
  { name: 'Maumere', type: 'town', province: 'Nusa Tenggara Timur', coordinates: { latitude: -8.6199, longitude: 122.2111 } },
  { name: 'Larantuka', type: 'town', province: 'Nusa Tenggara Timur', coordinates: { latitude: -8.3444, longitude: 122.9819 } },
  { name: 'Tobelo (Halmahera)', type: 'town', province: 'Maluku Utara', coordinates: { latitude: 1.7284, longitude: 128.0094 } },
  { name: 'Lumajang', type: 'town', province: 'Jawa Timur', coordinates: { latitude: -8.1331, longitude: 113.2248 } },
  { name: 'Probolinggo', type: 'city', province: 'Jawa Timur', coordinates: { latitude: -7.7543, longitude: 113.2159 } },
  { name: 'Magelang', type: 'city', province: 'Jawa Tengah', coordinates: { latitude: -7.4706, longitude: 110.2178 } },
  { name: 'Bukittinggi', type: 'city', province: 'Sumatera Barat', coordinates: { latitude: -0.3056, longitude: 100.3692 } },

  // Key Commercial Airports
  { name: 'Soekarno-Hatta Airport (CGK)', type: 'airport', code: 'CGK', province: 'Banten / Jakarta', coordinates: { latitude: -6.1275, longitude: 106.6537 } },
  { name: 'Halim Perdanakusuma Airport (HLP)', type: 'airport', code: 'HLP', province: 'DKI Jakarta', coordinates: { latitude: -6.2667, longitude: 106.8908 } },
  { name: 'Ngurah Rai Bali Airport (DPS)', type: 'airport', code: 'DPS', province: 'Bali', coordinates: { latitude: -8.7481, longitude: 115.1672 } },
  { name: 'Juanda Surabaya Airport (SUB)', type: 'airport', code: 'SUB', province: 'Jawa Timur', coordinates: { latitude: -7.3798, longitude: 112.7876 } },
  { name: 'Yogyakarta International Airport (YIA)', type: 'airport', code: 'YIA', province: 'DI Yogyakarta', coordinates: { latitude: -7.9016, longitude: 110.0573 } },
  { name: 'Lombok Praya Airport (LOP)', type: 'airport', code: 'LOP', province: 'Nusa Tenggara Barat', coordinates: { latitude: -8.7610, longitude: 116.2755 } },
  { name: 'Komodo Labuan Bajo Airport (LBJ)', type: 'airport', code: 'LBJ', province: 'Nusa Tenggara Timur', coordinates: { latitude: -8.4905, longitude: 119.8789 } },
  { name: 'Sultan Hasanuddin Makassar (UPG)', type: 'airport', code: 'UPG', province: 'Sulawesi Selatan', coordinates: { latitude: -5.0616, longitude: 119.5540 } },
  { name: 'Sam Ratulangi Manado (MDC)', type: 'airport', code: 'MDC', province: 'Sulawesi Utara', coordinates: { latitude: 1.5494, longitude: 124.9262 } },
  { name: 'Sultan Babullah Ternate (TTE)', type: 'airport', code: 'TTE', province: 'Maluku Utara', coordinates: { latitude: 0.8315, longitude: 127.3804 } },
  { name: 'El Tari Kupang (KOE)', type: 'airport', code: 'KOE', province: 'Nusa Tenggara Timur', coordinates: { latitude: -10.1714, longitude: 123.6708 } },
  { name: 'Kualanamu Medan (KNO)', type: 'airport', code: 'KNO', province: 'Sumatera Utara', coordinates: { latitude: 3.6422, longitude: 98.8853 } },
  { name: 'Minangkabau Padang (PDG)', type: 'airport', code: 'PDG', province: 'Sumatera Barat', coordinates: { latitude: -0.7870, longitude: 100.2808 } },
];

/**
 * Filter places by search text
 */
export function searchIndonesiaPlaces(query: string, maxResults = 8): IndonesiaPlace[] {
  if (!query || query.trim().length === 0) return [];
  const q = query.trim().toLowerCase();

  return INDONESIA_PLACES.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      (p.code && p.code.toLowerCase().includes(q)) ||
      p.province.toLowerCase().includes(q)
  ).slice(0, maxResults);
}
