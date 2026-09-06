export type MagmaLevel = 1 | 2 | 3 | 4;
export type MagmaLevelName = 'Normal' | 'Waspada' | 'Siaga' | 'Awas';
export type MagmaLevelRoman = 'Level I' | 'Level II' | 'Level III' | 'Level IV';

export interface MagmaVolcanoStatus {
  volcanoName: string;
  volcanoSlug: string;
  level: MagmaLevel;
  levelName: MagmaLevelName;
  levelRoman: MagmaLevelRoman;
  badgeLabel: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  ringColor: string;
  description: string;
  recommendation: string;
  source: string;
  sourceUrl: string;
}

export interface MonitoredVolcanoItem extends MagmaVolcanoStatus {
  position: { latitude: number; longitude: number };
  area: string;
  elevation: string;
  island: string;
}

export interface MagmaLevelMeta {
  level: MagmaLevel;
  name: MagmaLevelName;
  roman: MagmaLevelRoman;
  color: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  ringColor: string;
  shortLabel: string;
  description: string;
  defaultRecommendation: string;
}

/**
 * Konfigurasi 4 Tingkat Aktivitas Gunung Api Resmi PVMBG - Badan Geologi Kementerian ESDM
 * Sesuai panduan desain tugas.md: aksen warna terkalibrasi, kontras tinggi di tema gelap.
 */
export const MAGMA_LEVEL_CONFIG: Record<MagmaLevel, MagmaLevelMeta> = {
  4: {
    level: 4,
    name: 'Awas',
    roman: 'Level IV',
    color: '#EF4444',
    badgeBg: 'rgba(239, 68, 68, 0.15)',
    badgeText: '#F87171',
    badgeBorder: 'rgba(239, 68, 68, 0.35)',
    ringColor: 'rgba(239, 68, 68, 0.5)',
    shortLabel: 'AWAS',
    description: 'Letusan utama sedang atau segera berlangsung. Berpotensi meluas dan mengancam pemukiman.',
    defaultRecommendation: 'Masyarakat dan pengunjung dilarang beraktivitas di seluruh zona bahaya dan harus segera dievakuasi.',
  },
  3: {
    level: 3,
    name: 'Siaga',
    roman: 'Level III',
    color: '#FF6B1A', // Primary accent AshWatch
    badgeBg: 'rgba(255, 107, 26, 0.15)',
    badgeText: '#FF8A3D',
    badgeBorder: 'rgba(255, 107, 26, 0.35)',
    ringColor: 'rgba(255, 107, 26, 0.5)',
    shortLabel: 'SIAGA',
    description: 'Peningkatan kegiatan vulkanik semakin nyata atau erupsi mulai teramati mengancam kawah sekitar.',
    defaultRecommendation: 'Masyarakat/pengunjung dilarang beraktivitas dalam radius 3 - 5 km dari pusat kawah aktif.',
  },
  2: {
    level: 2,
    name: 'Waspada',
    roman: 'Level II',
    color: '#F59E0B',
    badgeBg: 'rgba(245, 158, 11, 0.15)',
    badgeText: '#FBBF24',
    badgeBorder: 'rgba(245, 158, 11, 0.35)',
    ringColor: 'rgba(245, 158, 11, 0.5)',
    shortLabel: 'WASPADA',
    description: 'Aktivitas seismik dan/atau visual di atas normal. Erupsi minor dapat terjadi di sekitar kawah.',
    defaultRecommendation: 'Masyarakat/pengunjung dihimbau tidak mendekati kawah dalam radius 1 - 3 km.',
  },
  1: {
    level: 1,
    name: 'Normal',
    roman: 'Level I',
    color: '#10B981',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
    badgeText: '#34D399',
    badgeBorder: 'rgba(16, 185, 129, 0.35)',
    ringColor: 'rgba(16, 185, 129, 0.5)',
    shortLabel: 'NORMAL',
    description: 'Aktivitas dasar vulkanik berfluktuasi namun tidak menunjukkan peningkatan ancaman kegempaan.',
    defaultRecommendation: 'Masyarakat dan wisatawan dapat beraktivitas seperti biasa dengan mematuhi rambu setempat.',
  },
};

interface VolcanoStatusEntry {
  level: MagmaLevel;
  position: { latitude: number; longitude: number };
  area: string;
  elevation: string;
  island: string;
  description?: string;
  recommendation?: string;
  aliases?: string[];
}

/**
 * Basis data status resmi dan geolokasi gunung api aktif di Indonesia dari PVMBG / MAGMA ESDM
 * Mencakup 4 tingkatan status (Level IV Awas, Level III Siaga, Level II Waspada, Level I Normal).
 */
export const MAGMA_VOLCANOES_DB: Record<string, VolcanoStatusEntry> = {
  // === LEVEL IV (AWAS) ===
  LEWOTOBI: {
    level: 4,
    position: { latitude: -8.538, longitude: 122.768 },
    area: 'Flores Timur, Nusa Tenggara Timur',
    elevation: '1,584 m',
    island: 'Nusa Tenggara',
    aliases: ['LEWOTOBI LAKI-LAKI', 'LEWOTOBI LAKILAKI', 'LEWOTOBI PEREMPUAN'],
    description: 'Letusan eksplosif terus menerus dengan lontaran material pijar ke segala arah, aliran awan panas guguran, dan sebaran abu tebal.',
    recommendation: 'Masyarakat dan wisatawan dilarang keras beraktivitas dalam radius 7 km dari pusat kawah serta mewaspadai potensi lahar dingin.',
  },
  RUANG: {
    level: 4,
    position: { latitude: 2.301, longitude: 125.367 },
    area: 'Kepulauan Sitaro, Sulawesi Utara',
    elevation: '725 m',
    island: 'Sulawesi',
    aliases: ['MT RUANG', 'G. RUANG', 'PULAU RUANG'],
    description: 'Erupsi eksplosif berskala besar disertai awan panas dan potensi bahaya tsunami akibat runtuhan material vulkanik ke laut.',
    recommendation: 'Masyarakat dievakuasi di luar radius 6 - 7 km dari kawah aktif serta menjauhi wilayah pantai timur Pulau Tagulandang.',
  },

  // === LEVEL III (SIAGA) ===
  KRAKATAU: {
    level: 3,
    position: { latitude: -6.102, longitude: 105.423 },
    area: 'Selat Sunda, Lampung',
    elevation: '157 m',
    island: 'Sumatera',
    aliases: ['ANAK KRAKATAU', 'ANAK-KRAKATAU', 'KRAKATOA'],
    description: 'Erupsi abu vulkanik terus menerus teramati dengan kolom letusan membumbung ke atmosfer.',
    recommendation: 'Masyarakat/wisatawan dilarang mendekati Gunung Anak Krakatau dalam radius 5 km dari kawah aktif.',
  },
  SEMERU: {
    level: 3,
    position: { latitude: -8.108, longitude: 112.922 },
    area: 'Lumajang, Jawa Timur',
    elevation: '3,676 m',
    island: 'Jawa',
    aliases: ['MT SEMERU', 'G. SEMERU'],
    description: 'Aktivitas letusan, guguran lava, dan awan panas guguran teramati ke arah sektor tenggara Besuk Kobokan.',
    recommendation: 'Hindari aktivitas di sektor tenggara sepanjang Besuk Kobokan sejauh 13 km dari puncak.',
  },
  IBU: {
    level: 3,
    position: { latitude: 1.488, longitude: 127.630 },
    area: 'Halmahera Barat, Maluku Utara',
    elevation: '1,325 m',
    island: 'Maluku',
    aliases: ['MT IBU', 'G. IBU'],
    description: 'Erupsi menerus dengan lontaran abu tebal dan dentuman periodik teramati.',
    recommendation: 'Masyarakat dan wisatawan dilarang beraktivitas dalam radius 4 km dari kawah utama.',
  },
  MERAPI: {
    level: 3,
    position: { latitude: -7.540, longitude: 110.446 },
    area: 'Sleman / Magelang, D.I. Yogyakarta / Jawa Tengah',
    elevation: '2,930 m',
    island: 'Jawa',
    aliases: ['MT MERAPI', 'G. MERAPI'],
    description: 'Kubah lava aktif mengalami guguran dan potensi awan panas ke sektor barat daya-selatan.',
    recommendation: 'Hindari potensi bahaya guguran lava dan awan panas dalam radius 3 - 7 km.',
  },
  MARAPI: {
    level: 3,
    position: { latitude: -0.381, longitude: 100.473 },
    area: 'Agam / Tanah Datar, Sumatera Barat',
    elevation: '2,891 m',
    island: 'Sumatera',
    aliases: ['MT MARAPI', 'G. MARAPI'],
    description: 'Peningkatan intensitas erupsi eksplosif dan hembusan abu vulkanik berkala teramati di kawah Verbeek.',
    recommendation: 'Masyarakat dilarang mendekati atau beraktivitas dalam radius 4.5 km dari pusat kawah.',
  },

  // === LEVEL II (WASPADA) ===
  LEWOTOLOK: {
    level: 2,
    position: { latitude: -8.272, longitude: 123.505 },
    area: 'Lembata, Nusa Tenggara Timur',
    elevation: '1,423 m',
    island: 'Nusa Tenggara',
    aliases: ['ILI LEWOTOLOK', 'ILE LEWOTOLOK'],
    description: 'Aktivitas erupsi strombolian berkala dengan lontaran material pijar di dalam kawah.',
    recommendation: 'Masyarakat dihimbau tidak beraktivitas dalam radius 2 - 3 km dari kawah puncak.',
  },
  DUKONO: {
    level: 2,
    position: { latitude: 1.693, longitude: 127.894 },
    area: 'Halmahera Utara, Maluku Utara',
    elevation: '1,229 m',
    island: 'Maluku',
    aliases: ['MT DUKONO', 'G. DUKONO'],
    description: 'Letusan abu vulkanik berkala terus menerus dengan hembusan asap putih-kelabu tebal.',
    recommendation: 'Masyarakat dan pengunjung dilarang mendekati kawah Malupang Warirang dalam radius 2 km.',
  },
  SINABUNG: {
    level: 2,
    position: { latitude: 3.170, longitude: 98.392 },
    area: 'Karo, Sumatera Utara',
    elevation: '2,460 m',
    island: 'Sumatera',
    aliases: ['MT SINABUNG', 'G. SINABUNG'],
    description: 'Aktivitas hembusan gas kawah dan gempa vulkanik dalam status pemantauan intensif.',
    recommendation: 'Hindari zona merah dalam radius 3 km dari kawah serta jalur aliran lahar.',
  },
  BROMO: {
    level: 2,
    position: { latitude: -7.942, longitude: 112.950 },
    area: 'Probolinggo / Pasuruan, Jawa Timur',
    elevation: '2,329 m',
    island: 'Jawa',
    aliases: ['MT BROMO', 'TENGGER'],
    description: 'Asap kawah bertekanan lemah hingga sedang, teramati hembusan gas belerang periodik.',
    recommendation: 'Masyarakat dan wisatawan tidak diperbolehkan memasuki kawasan kawah dalam radius 1 km.',
  },
  KERINCI: {
    level: 2,
    position: { latitude: -1.697, longitude: 101.264 },
    area: 'Kerinci, Jambi / Sumatera Barat',
    elevation: '3,805 m',
    island: 'Sumatera',
    aliases: ['MT KERINCI'],
    description: 'Hembusan asap putih kelabu dan rekaman gempa hembusan berlangsung fluktuatif.',
    recommendation: 'Masyarakat dan pengunjung tidak diperbolehkan mendekati kawah dalam radius 3 km.',
  },
  KARANGETANG: {
    level: 2,
    position: { latitude: 2.781, longitude: 125.407 },
    area: 'Kepulauan Siau, Sulawesi Utara',
    elevation: '1,784 m',
    island: 'Sulawesi',
    aliases: ['API SIAU'],
    description: 'Aktivitas guguran lava dan lelehan kubah lava ke lembah kawah utama.',
    recommendation: 'Hindari aktivitas dalam radius 1.5 - 2.5 km dari kawah utama.',
  },
  SOPUTAN: {
    level: 2,
    position: { latitude: 1.112, longitude: 124.737 },
    area: 'Minahasa Tenggara, Sulawesi Utara',
    elevation: '1,785 m',
    island: 'Sulawesi',
    aliases: ['MT SOPUTAN'],
    description: 'Kubah lava dalam kondisi tenang berfluktuasi dengan rekaman seismik vulkanik normal ke waspada.',
    recommendation: 'Hindari beraktivitas dalam radius 1.5 km dari puncak.',
  },
  LOKON: {
    level: 2,
    position: { latitude: 1.358, longitude: 124.793 },
    area: 'Tomohon, Sulawesi Utara',
    elevation: '1,580 m',
    island: 'Sulawesi',
    aliases: ['LOKON EMPUNG', 'LOKON-EMPUNG'],
    description: 'Aktivitas gempa vulkanik dangkal teramati dengan hembusan asap kawah Tompaluan.',
    recommendation: 'Masyarakat tidak beraktivitas dalam radius 1.5 km dari kawah Tompaluan.',
  },
  GAMALAMA: {
    level: 2,
    position: { latitude: 0.801, longitude: 127.325 },
    area: 'Ternate, Maluku Utara',
    elevation: '1,715 m',
    island: 'Maluku',
    aliases: ['MT GAMALAMA'],
    description: 'Hembusan asap putih tipis hingga sedang dan rekaman gempa tektonik lokal.',
    recommendation: 'Masyarakat tidak beraktivitas dalam radius 1.5 km dari kawah puncak.',
  },
  RAUNG: {
    level: 2,
    position: { latitude: -8.125, longitude: 114.046 },
    area: 'Banyuwangi / Bondowoso, Jawa Timur',
    elevation: '3,332 m',
    island: 'Jawa',
    aliases: ['MT RAUNG'],
    description: 'Hembusan gas kawah dan rekaman tremor non-harmonik kontinu.',
    recommendation: 'Masyarakat dilarang menuruni dasar kaldera atau beraktivitas dalam radius 3 km.',
  },
  DEMPO: {
    level: 2,
    position: { latitude: -4.030, longitude: 103.130 },
    area: 'Pagar Alam, Sumatera Selatan',
    elevation: '3,173 m',
    island: 'Sumatera',
    aliases: ['MT DEMPO'],
    description: 'Perubahan warna dan suhu air danau kawah teramati disertai emisi gas.',
    recommendation: 'Masyarakat tidak mendekati kawah dalam radius 1 km.',
  },
  SLAMET: {
    level: 2,
    position: { latitude: -7.242, longitude: 109.208 },
    area: 'Banyumas / Purbalingga, Jawa Tengah',
    elevation: '3,428 m',
    island: 'Jawa',
    aliases: ['MT SLAMET'],
    description: 'Peningkatan gempa hembusan dan gempa vulkanik dalam.',
    recommendation: 'Masyarakat dilarang beraktivitas dalam radius 2 km dari kawah puncak.',
  },
  AWU: {
    level: 2,
    position: { latitude: 3.683, longitude: 125.450 },
    area: 'Kepulauan Sangihe, Sulawesi Utara',
    elevation: '1,320 m',
    island: 'Sulawesi',
    aliases: ['MT AWU'],
    description: 'Pemantauan deformasi dan gempa vulkanik dangkal.',
    recommendation: 'Masyarakat tidak beraktivitas dalam radius 3 km dari kawah.',
  },
  GAMKONORA: {
    level: 2,
    position: { latitude: 1.378, longitude: 127.533 },
    area: 'Halmahera Barat, Maluku Utara',
    elevation: '1,635 m',
    island: 'Maluku',
    aliases: ['MT GAMKONORA'],
    description: 'Aktivitas hembusan solfatara kawah dalam batas fluktuasi normal ke waspada.',
    recommendation: 'Masyarakat dihimbau tidak mendekati kawah aktif dalam radius 1.5 km.',
  },
  TANDIKAT: {
    level: 2,
    position: { latitude: -0.433, longitude: 100.317 },
    area: 'Padang Pariaman, Sumatera Barat',
    elevation: '2,438 m',
    island: 'Sumatera',
    aliases: ['MT TANDIKAT'],
    description: 'Aktivitas hembusan kawah A, B, dan K teramati stabil dengan pengawasan berkala.',
    recommendation: 'Hindari aktivitas di bibir kawah aktif.',
  },
  PAPANDAYAN: {
    level: 2,
    position: { latitude: -7.320, longitude: 107.730 },
    area: 'Garut, Jawa Barat',
    elevation: '2,665 m',
    island: 'Jawa',
    aliases: ['MT PAPANDAYAN'],
    description: 'Kawah Mas dan Kawah Baru memperlihatkan emisi solfatara dan gas belerang aktif.',
    recommendation: 'Wisatawan dilarang mendekati pusat lubang gas bertekanan tinggi.',
  },

  // === LEVEL I (NORMAL) ===
  KELUD: {
    level: 1,
    position: { latitude: -7.930, longitude: 112.308 },
    area: 'Kediri / Blitar, Jawa Timur',
    elevation: '1,731 m',
    island: 'Jawa',
    aliases: ['MT KELUD'],
    description: 'Aktivitas dasar normal pasca erupsi 2014, kubah lava dan danau kawah stabil.',
    recommendation: 'Masyarakat dapat beraktivitas seperti biasa dengan mematuhi rambu peringatan setempat.',
  },
  AGUNG: {
    level: 1,
    position: { latitude: -8.343, longitude: 115.508 },
    area: 'Karangasem, Bali',
    elevation: '3,031 m',
    island: 'Bali',
    aliases: ['MT AGUNG'],
    description: 'Aktivitas seismik berada pada level dasar, tidak ada peningkatan deformasi.',
    recommendation: 'Aktivitas pendakian dan wisata normal dengan mematuhi aturan PVMBG dan pengelola lokal.',
  },
  RINJANI: {
    level: 1,
    position: { latitude: -8.420, longitude: 116.470 },
    area: 'Lombok Utara, Nusa Tenggara Barat',
    elevation: '3,726 m',
    island: 'Nusa Tenggara',
    aliases: ['MT RINJANI', 'BARUJARI'],
    description: 'Kawah Danau Segara Anak dan Gunung Barujari dalam status dasar normal.',
    recommendation: 'Wisata dan pendakian aman dengan mengikuti prosedur resmi Taman Nasional.',
  },
  BATUR: {
    level: 1,
    position: { latitude: -8.242, longitude: 115.375 },
    area: 'Bangli, Bali',
    elevation: '1,717 m',
    island: 'Bali',
    aliases: ['MT BATUR'],
    description: 'Aktivitas kawah fumarol normal dan stabil.',
    recommendation: 'Masyarakat dan wisatawan dapat beraktivitas seperti biasa.',
  },
  TANGKUBAN_PARAHU: {
    level: 1,
    position: { latitude: -6.770, longitude: 107.600 },
    area: 'Bandung Barat / Subang, Jawa Barat',
    elevation: '2,084 m',
    island: 'Jawa',
    aliases: ['TANGKUBAN PARAHU', 'TANGKUBAN PERAHU'],
    description: 'Aktivitas gas di Kawah Ratu dan Kawah Domas dalam kondisi batas aman terpantau.',
    recommendation: 'Pengunjung dapat berwisata dan dihimbau tidak menuruni kawah saat cuaca mendung/hujan.',
  },
  DIENG: {
    level: 1,
    position: { latitude: -7.200, longitude: 109.900 },
    area: 'Banjarnegara / Wonosobo, Jawa Tengah',
    elevation: '2,565 m',
    island: 'Jawa',
    aliases: ['DATARAN TINGGI DIENG', 'KAWAH SIKIDANG'],
    description: 'Konsentrasi gas vulkanik di kawah-kawah aktif berada dalam ambang batas normal.',
    recommendation: 'Masyarakat dapat beraktivitas normal dan mematuhi rambu batas gas beracun.',
  },
  GALUNGGUNG: {
    level: 1,
    position: { latitude: -7.250, longitude: 108.058 },
    area: 'Tasikmalaya, Jawa Barat',
    elevation: '2,168 m',
    island: 'Jawa',
    aliases: ['MT GALUNGGUNG'],
    description: 'Danau kawah stabil dengan suhu air dan aktivitas hembusan normal.',
    recommendation: 'Aktivitas wisata kawah berjalan normal.',
  },
  GEDE: {
    level: 1,
    position: { latitude: -6.780, longitude: 106.980 },
    area: 'Cianjur / Sukabumi, Jawa Barat',
    elevation: '2,958 m',
    island: 'Jawa',
    aliases: ['MT GEDE', 'GEDE PANGRANGO'],
    description: 'Aktivitas solfatara Kawah Ratu stabil tanpa gejala peningkatan vulkanik.',
    recommendation: 'Pendakian dibuka sesuai regulasi Balai Besar Taman Nasional.',
  },
  SALAK: {
    level: 1,
    position: { latitude: -6.720, longitude: 106.730 },
    area: 'Bogor / Sukabumi, Jawa Barat',
    elevation: '2,211 m',
    island: 'Jawa',
    aliases: ['MT SALAK'],
    description: 'Kawah Ratu memperlihatkan hembusan gas fumarol normal.',
    recommendation: 'Masyarakat dan wisatawan dapat beraktivitas normal.',
  },
  CIREMAI: {
    level: 1,
    position: { latitude: -6.892, longitude: 108.400 },
    area: 'Kuningan / Majalengka, Jawa Barat',
    elevation: '3,078 m',
    island: 'Jawa',
    aliases: ['MT CIREMAI', 'CEREME'],
    description: 'Kawah puncak dalam kondisi tenang tanpa kegempaan vulkanik mencolok.',
    recommendation: 'Pendakian dan aktivitas masyarakat normal.',
  },
  SINDORO: {
    level: 1,
    position: { latitude: -7.300, longitude: 109.990 },
    area: 'Temanggung / Wonosobo, Jawa Tengah',
    elevation: '3,136 m',
    island: 'Jawa',
    aliases: ['MT SINDORO', 'SUNDORO'],
    description: 'Fumarol kawah puncak dalam kondisi normal bertekanan lemah.',
    recommendation: 'Aktivitas masyarakat dan pendakian aman.',
  },
  SUMBING: {
    level: 1,
    position: { latitude: -7.380, longitude: 110.070 },
    area: 'Magelang / Temanggung, Jawa Tengah',
    elevation: '3,371 m',
    island: 'Jawa',
    aliases: ['MT SUMBING'],
    description: 'Aktivitas solfatara kawah dasar normal tanpa deformasi.',
    recommendation: 'Aktivitas wisata dan pertanian lereng normal.',
  },
  LAWU: {
    level: 1,
    position: { latitude: -7.630, longitude: 111.190 },
    area: 'Karanganyar, Jawa Tengah / Magetan, Jawa Timur',
    elevation: '3,265 m',
    island: 'Jawa',
    aliases: ['MT LAWU'],
    description: 'Kawah Candradimuka menunjukkan hembusan solfatara stabil batas normal.',
    recommendation: 'Wisata dan pendakian aman.',
  },
  ARJUNO_WELIRANG: {
    level: 1,
    position: { latitude: -7.765, longitude: 112.580 },
    area: 'Malang / Pasuruan, Jawa Timur',
    elevation: '3,339 m',
    island: 'Jawa',
    aliases: ['ARJUNO', 'WELIRANG', 'MT ARJUNO'],
    description: 'Kawah belerang Welirang aktif normal tanpa peningkatan kegempaan magmatik.',
    recommendation: 'Aktivitas masyarakat dan pendakian aman terkendali.',
  },
  TAMBORA: {
    level: 1,
    position: { latitude: -8.250, longitude: 118.000 },
    area: 'Bima / Dompu, Sumbawa, NTB',
    elevation: '2,850 m',
    island: 'Nusa Tenggara',
    aliases: ['MT TAMBORA'],
    description: 'Kaldera raksasa Tambora dalam kondisi dasar normal terpantau aman.',
    recommendation: 'Wisata kaldera dibuka normal.',
  },
  SANGEANG_API: {
    level: 1,
    position: { latitude: -8.200, longitude: 119.070 },
    area: 'Bima, Nusa Tenggara Barat',
    elevation: '1,949 m',
    island: 'Nusa Tenggara',
    aliases: ['SANGEANGAPI', 'SANGEANG'],
    description: 'Kubah lava kawah Doro Api tenang berfluktuasi.',
    recommendation: 'Masyarakat dapat beraktivitas normal di pulau sekitar.',
  },
  IYANG_ARGOPURO: {
    level: 1,
    position: { latitude: -7.970, longitude: 113.570 },
    area: 'Probolinggo / Situbondo, Jawa Timur',
    elevation: '3,088 m',
    island: 'Jawa',
    aliases: ['ARGOPURO', 'IYANG'],
    description: 'Kawasan kaldera Iyang dalam status normal tenang.',
    recommendation: 'Aktivitas pendakian jalur suaka margasatwa dibuka aman.',
  },
};

/**
 * Normalisasi nama gunung untuk pencocokan toleran (case-insensitive, strip prefixes)
 */
function normalizeName(name: string): string {
  return name
    .toUpperCase()
    .replace(/^GUNUNG\s+|^G\.\s+|^MT\.\s+|^MT\s+|^MOUNT\s+/i, '')
    .replace(/[-_]/g, ' ')
    .trim();
}

/**
 * Mengambil status resmi aktivitas gunung api dari MAGMA Indonesia (PVMBG - ESDM)
 * @param volcanoName Nama gunung api (misal: 'Semeru', 'Ibu', 'Krakatau', 'Lewotobi')
 */
export function getMagmaVolcanoStatus(volcanoName: string): MagmaVolcanoStatus {
  const norm = normalizeName(volcanoName);
  const slug = norm.toLowerCase().replace(/\s+/g, '-');

  // 1. Direct key match
  let entry: VolcanoStatusEntry | undefined = MAGMA_VOLCANOES_DB[norm];

  // 2. Alias match
  if (!entry) {
    for (const [key, val] of Object.entries(MAGMA_VOLCANOES_DB)) {
      if (key === norm) {
        entry = val;
        break;
      }
      if (val.aliases && val.aliases.some((a) => normalizeName(a) === norm)) {
        entry = val;
        break;
      }
    }
  }

  // 3. Partial substring match (e.g. "LEWOTOBI LAKI-LAKI" matches "LEWOTOBI")
  if (!entry) {
    for (const [key, val] of Object.entries(MAGMA_VOLCANOES_DB)) {
      if (norm.includes(key) || key.includes(norm)) {
        entry = val;
        break;
      }
      if (val.aliases && val.aliases.some((a) => norm.includes(normalizeName(a)) || normalizeName(a).includes(norm))) {
        entry = val;
        break;
      }
    }
  }

  // 4. Default fallback: jika gunung belum terdaftar spesifik
  const level: MagmaLevel = entry ? entry.level : 2;
  const cfg = MAGMA_LEVEL_CONFIG[level];

  return {
    volcanoName: volcanoName.toUpperCase(),
    volcanoSlug: slug,
    level,
    levelName: cfg.name,
    levelRoman: cfg.roman,
    badgeLabel: `${cfg.roman} (${cfg.name})`,
    color: cfg.color,
    badgeBg: cfg.badgeBg,
    badgeText: cfg.badgeText,
    badgeBorder: cfg.badgeBorder,
    ringColor: cfg.ringColor,
    description: entry?.description || cfg.description,
    recommendation: entry?.recommendation || cfg.defaultRecommendation,
    source: 'PVMBG · MAGMA Indonesia (Badan Geologi ESDM)',
    sourceUrl: 'https://magma.esdm.go.id',
  };
}

/**
 * Mengambil daftar seluruh gunung api yang dipantau PVMBG / MAGMA ESDM
 * di seluruh 4 tingkatan level aktivitas.
 */
export function getAllMonitoredVolcanoes(): MonitoredVolcanoItem[] {
  return Object.entries(MAGMA_VOLCANOES_DB).map(([key, entry]) => {
    const rawName = entry.aliases && entry.aliases.length > 0 ? entry.aliases[0] : key;
    const norm = normalizeName(rawName);
    const slug = norm.toLowerCase().replace(/\s+/g, '-');
    const cfg = MAGMA_LEVEL_CONFIG[entry.level];

    return {
      volcanoName: norm,
      volcanoSlug: slug,
      level: entry.level,
      levelName: cfg.name,
      levelRoman: cfg.roman,
      badgeLabel: `${cfg.roman} (${cfg.name})`,
      color: cfg.color,
      badgeBg: cfg.badgeBg,
      badgeText: cfg.badgeText,
      badgeBorder: cfg.badgeBorder,
      ringColor: cfg.ringColor,
      position: entry.position,
      area: entry.area,
      elevation: entry.elevation,
      island: entry.island,
      description: entry.description || cfg.description,
      recommendation: entry.recommendation || cfg.defaultRecommendation,
      source: 'PVMBG · MAGMA Indonesia (Badan Geologi ESDM)',
      sourceUrl: 'https://magma.esdm.go.id',
    };
  });
}
