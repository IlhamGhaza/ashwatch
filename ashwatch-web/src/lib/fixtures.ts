export const SINGLE_ADVISORY_FIXTURE = `
VA ADVISORY
DTG: 20260904/1400Z
VAAC: DARWIN
VOLCANO: LEWOTOLOK 264230
PSN: S0816 E12330
AREA: INDONESIA
SOURCE ELEV: 1423M AMSL
ADVISORY NR: 2026/192
INFO SOURCE: HIMAWARI-9
ERUPTION DETAILS: VA TO FL060
OBS VA CLD:
SFC/FL060 S0819 E12332 - S0811 E12246 - S0746 E12244 - S0746 E12335 - S0819 E12332 MOV NW 05KT
FCST VA CLD +6 HR:
04/1940Z SFC/FL060 S0830 E12310 - S0810 E12220 - S0730 E12220 - S0730 E12340 - S0830 E12310
FCST VA CLD +12 HR:
05/0140Z SFC/FL060 S0840 E12300 - S0810 E12200 - S0720 E12200 - S0720 E12340 - S0840 E12300
FCST VA CLD +18 HR:
05/0740Z SFC/FL060 S0850 E12250 - S0810 E12150 - S0710 E12150 - S0710 E12340 - S0850 E12250
RMK: VA INTERMITTENTLY IDENTIFIABLE ON LATEST SAT IMAGERY
NXT ADVISORY: 20260904/2000Z=
`;

export const MULTIPLE_ADVISORIES_FIXTURE = `
VA ADVISORY
DTG: 20260904/1400Z
VAAC: DARWIN
VOLCANO: LEWOTOLOK 264230
PSN: S0816 E12330
AREA: INDONESIA
SOURCE ELEV: 1423M AMSL
ADVISORY NR: 2026/192
INFO SOURCE: HIMAWARI-9
ERUPTION DETAILS: VA TO FL060
OBS VA CLD:
SFC/FL060 S0819 E12332 - S0811 E12246 - S0746 E12244 - S0746 E12335 - S0819 E12332 MOV NW 05KT
FCST VA CLD +6 HR:
04/1940Z SFC/FL060 S0830 E12310 - S0810 E12220 - S0730 E12220 - S0730 E12340 - S0830 E12310
FCST VA CLD +12 HR:
05/0140Z NO VA EXP
FCST VA CLD +18 HR:
05/0740Z NO VA EXP
RMK: NIL
NXT ADVISORY: 20260904/2000Z=

VA ADVISORY
DTG: 20260904/1200Z
VAAC: DARWIN
VOLCANO: DUKONO 268100
PSN: N0141 E12753
AREA: INDONESIA
SOURCE ELEV: 1229M AMSL
ADVISORY NR: 2026/708
INFO SOURCE: HIMAWARI-9
ERUPTION DETAILS: CONTINUOUS VA TO FL070
OBS VA CLD:
SFC/FL070 N0148 E12750 - N0130 E12800 - N0120 E12740 - N0148 E12750 MOV W 10KT
FCST VA CLD +6 HR:
04/1800Z SFC/FL070 N0155 E12730 - N0125 E12810 - N0110 E12720 - N0155 E12730
FCST VA CLD +12 HR:
05/0000Z SFC/FL070 N0200 E12710 - N0120 E12810 - N0100 E12700 - N0200 E12710
FCST VA CLD +18 HR:
05/0600Z SFC/FL070 N0210 E12650 - N0115 E12810 - N0050 E12640 - N0210 E12650
RMK: NIL
NXT ADVISORY: 20260904/1800Z=

VA ADVISORY
DTG: 20260904/0800Z
VAAC: DARWIN
VOLCANO: SEMERU 263350
PSN: S0806 E11255
AREA: INDONESIA
SOURCE ELEV: 3676M AMSL
ADVISORY NR: 2026/1010
INFO SOURCE: HIMAWARI-9
ERUPTION DETAILS: VA TO FL150
OBS VA CLD:
SFC/FL150 S0806 E11255 - S0830 E11310 - S0900 E11240 - S0830 E11200 - S0806 E11255 MOV SW 15KT
FCST VA CLD +6 HR:
04/1400Z SFC/FL150 S0810 E11250 - S0840 E11320 - S0920 E11230 - S0840 E11180 - S0810 E11250
FCST VA CLD +12 HR:
04/2000Z NO VA EXP
FCST VA CLD +18 HR:
05/0200Z NO VA EXP
RMK: NIL
NXT ADVISORY: 20260904/1400Z=

VA ADVISORY
DTG: 20260904/1400Z
VAAC: DARWIN
VOLCANO: KRAKATAU 262000
PSN: S0610 E10526
AREA: INDONESIA
SOURCE ELEV: 155M AMSL
ADVISORY NR: 2026/161
INFO SOURCE: HIMAWARI-9
ERUPTION DETAILS: VA TO FL050
OBS VA CLD:
SFC/FL050 S0606 E10530 - S0629 E10511 - S0631 E10444 - S0604 E10441 - S0600 E10527 MOV SW 05KT
FCST VA CLD +6 HR:
04/2000Z SFC/FL050 S0610 E10520 - S0635 E10500 - S0640 E10430 - S0610 E10430 - S0600 E10520
FCST VA CLD +12 HR:
05/0200Z NO VA EXP
FCST VA CLD +18 HR:
05/0800Z NO VA EXP
RMK: NIL
NXT ADVISORY: 20260904/2000Z=
`;

export const INDONESIA_VOLCANO_DATABASE = [
  {
    name: 'Krakatau',
    slug: 'krakatau',
    elevation: '155 m',
    location: 'Sunda Strait, Lampung/Banten',
    island: 'Sumatra / Java',
    coordinates: { latitude: -6.102, longitude: 105.423 },
    status: 'Active' as const,
    description: 'Caldera volcano situated in the Sunda Strait between Java and Sumatra. Known for violent phreatomagmatic eruptions that affect international air traffic corridors across Jakarta and Singapore.',
    aviationSignificance: 'Located directly beneath high-density international air traffic routes connecting Jakarta (CGK) to Sumatra and Singapore (SIN).'
  },
  {
    name: 'Semeru',
    slug: 'semeru',
    elevation: '3,676 m',
    location: 'East Java',
    island: 'Java',
    coordinates: { latitude: -8.108, longitude: 112.922 },
    status: 'Active' as const,
    description: 'The highest peak in Java and one of the most frequently erupting volcanoes in Indonesia, producing frequent pyroclastic flows and volcanic ash plumes up to FL150+.',
    aviationSignificance: 'Impacts East Java airspace, flight paths into Surabaya (SUB), Malang (MLG), and Bali (DPS).'
  },
  {
    name: 'Lewotolok',
    slug: 'lewotolok',
    elevation: '1,423 m',
    location: 'Lembata Island, East Nusa Tenggara',
    island: 'Lesser Sunda Islands',
    coordinates: { latitude: -8.272, longitude: 123.505 },
    status: 'Active' as const,
    description: 'Stratovolcano on Lembata Island experiencing persistent strombolian activity with intermittent ash plumes drifting across the Flores Sea.',
    aviationSignificance: 'Affects regional domestic flights between Kupang, Flores, and Timor.'
  },
  {
    name: 'Dukono',
    slug: 'dukono',
    elevation: '1,229 m',
    location: 'Halmahera, North Maluku',
    island: 'Maluku',
    coordinates: { latitude: 1.693, longitude: 127.894 },
    status: 'Active' as const,
    description: 'Extremely active volcano with continuous explosive activity generating near-daily volcanic ash advisories from Darwin VAAC.',
    aviationSignificance: 'Dominates air routes across North Maluku, Manado, and flights into Ternate (TTE).'
  },
  {
    name: 'Ibu',
    slug: 'ibu',
    elevation: '1,325 m',
    location: 'Halmahera, North Maluku',
    island: 'Maluku',
    coordinates: { latitude: 1.488, longitude: 127.63 },
    status: 'Active' as const,
    description: 'Truncated stratovolcano on Halmahera that has been persistently active since 1998 with frequent ash explosions rising 1,000–3,000 meters above the crater.',
    aviationSignificance: 'Frequent emitter of ash columns across Halmahera and Maluku Sea flight lanes.'
  },
  {
    name: 'Marapi',
    slug: 'marapi',
    elevation: '2,891 m',
    location: 'West Sumatra',
    island: 'Sumatra',
    coordinates: { latitude: -0.381, longitude: 100.473 },
    status: 'Active' as const,
    description: 'Complex stratovolcano in West Sumatra, one of Sumatra’s most active volcanoes with historical sudden phreatic explosions.',
    aviationSignificance: 'Direct impact on Padang (PDG) and West Sumatra commercial aviation routes.'
  },
  {
    name: 'Merapi',
    slug: 'merapi',
    elevation: '2,910 m',
    location: 'Central Java / Yogyakarta',
    island: 'Java',
    coordinates: { latitude: -7.540, longitude: 110.446 },
    status: 'Active' as const,
    description: 'One of the world’s most dangerous decade volcanoes, situated directly adjacent to the densely populated metropolitan area of Yogyakarta.',
    aviationSignificance: 'Can abruptly shut down Yogyakarta (YIA/JOG) and Solo (SOC) airports during significant explosive events.'
  }
];
