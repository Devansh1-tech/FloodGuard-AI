/**
 * teraiRegions.ts — Spatial & Thematic Intelligence Data for Nepal Terai Flood Monitoring.
 *
 * Contains:
 * - Delineated flood inundation polygons per region (Sentinel-1 SAR detected).
 * - Safe elevated high-ground zones (Refuge & Relief Camps).
 * - Flooded vs Safe settlement markers with population & depth metrics.
 * - Satellite dataset profiles (Sentinel-1 SAR vs Sentinel-2 MSI).
 * - Historical & Custom Date Presets.
 */

export interface VillageSettlement {
  id: string;
  name: string;
  district: string;
  coords: [number, number]; // [lat, lng]
  isFlooded: boolean;
  status: string;
  floodDepthMeters?: number;
  population: number;
  recommendedAction: string;
}

export interface SafeHavenZone {
  id: string;
  name: string;
  district: string;
  coords: [number, number];
  polygon: [number, number][];
  elevationMeters: number;
  shelterCapacity: number;
  contactAgency: string;
}

export interface TeraiRegionData {
  id: string;
  name: string;
  shortName: string;
  basin: string;
  districts: string[];
  center: [number, number];
  zoom: number;
  floodAreaKm2: number;
  safeAreaKm2: number;
  affectedPopulation: number;
  deltaDb: number;
  otsuThreshold: number;
  floodPolygons: [number, number][][];
  safeZones: SafeHavenZone[];
  settlements: VillageSettlement[];
}

export interface SatelliteDataset {
  id: 'sentinel1_sar' | 'sentinel2_optical';
  name: string;
  fullName: string;
  sensor: string;
  bands: string;
  resolution: string;
  penetration: string;
  badgeColor: string;
  description: string;
}

export const SATELLITE_DATASETS: Record<string, SatelliteDataset> = {
  sentinel1_sar: {
    id: 'sentinel1_sar',
    name: 'Sentinel-1 SAR',
    fullName: 'Copernicus Sentinel-1 C-SAR Dual-Polarization (VV+VH)',
    sensor: 'C-Band Synthetic Aperture Radar (5.405 GHz)',
    bands: 'VV (Vertical Transmit/Receive) & VH (Cross-Pol)',
    resolution: '10m Ground Sampling Distance (GSD)',
    penetration: '100% Cloud, Smoke & Night Penetration (All-Weather)',
    badgeColor: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400',
    description:
      'Microwave specular reflection detects standing flood water even under thick monsoon cloud cover where optical satellites cannot see.',
  },
  sentinel2_optical: {
    id: 'sentinel2_optical',
    name: 'Sentinel-2 MSI',
    fullName: 'Copernicus Sentinel-2 Multispectral Instrument (MSI)',
    sensor: '13-Band Optical / Near-Infrared Radiometer',
    bands: 'True Color (B4-Red, B3-Green, B2-Blue) & NDWI (B3-B8)',
    resolution: '10m / 20m Spatial Resolution',
    penetration: 'Optical (Requires cloud clearance < 25%)',
    badgeColor: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
    description:
      'Normalized Difference Water Index (NDWI) and False Color NIR reveal sediment turbidity, agricultural crop washouts, and receding silt.',
  },
};

export const DATE_PRESETS = [
  {
    id: 'monsoon_deluge_2024',
    label: '2024 Nepal Monsoon Catastrophe (Peak Deluge)',
    badge: 'PEAK CRISIS',
    beforeDate: '2024-06-15',
    afterDate: '2024-10-01',
    description: 'Catastrophic cloudburst causing widespread embankment breaches in Koshi and Bagmati.',
  },
  {
    id: 'receding_phase_2024',
    label: 'Post-Monsoon Water Receding Phase',
    badge: 'RECEDING',
    beforeDate: '2024-06-15',
    afterDate: '2024-10-18',
    description: 'Floodwaters draining into major river channels; waterlogging persists in depressions.',
  },
  {
    id: 'early_monsoon_surge_2024',
    label: 'Early Monsoon Overflow Surge',
    badge: 'EARLY INUNDATION',
    beforeDate: '2024-06-01',
    afterDate: '2024-07-20',
    description: 'First wave of monsoon runoff triggering seasonal flash floods in southern lowlands.',
  },
];

export const TERAI_REGIONS: Record<string, TeraiRegionData> = {
  full_terai: {
    id: 'full_terai',
    name: 'Full Nepal Terai Plains (All 21 Lowland Districts)',
    shortName: 'Full Terai Belt',
    basin: 'Trans-Nepal Lowland Corridor (Mahakali to Mechi)',
    districts: [
      'Jhapa', 'Morang', 'Sunsari', 'Saptari', 'Siraha',
      'Dhanusa', 'Mahottari', 'Sarlahi', 'Rautahat', 'Bara',
      'Parsa', 'Chitawan', 'Nawalparasi East', 'Nawalparasi West',
      'Rupandehi', 'Kapilbastu', 'Dang', 'Banke', 'Bardiya',
      'Kailali', 'Kanchanpur'
    ],
    center: [26.85, 85.30],
    zoom: 8.0,
    floodAreaKm2: 642.8,
    safeAreaKm2: 23150.0,
    affectedPopulation: 428600,
    deltaDb: -8.8,
    otsuThreshold: -15.2,
    floodPolygons: [
      // 1. Saptakoshi Braided River Inundation Corridor (Sunsari / Saptari)
      [
        [26.89, 87.16], [26.85, 87.14], [26.80, 87.10], [26.74, 87.05],
        [26.68, 87.01], [26.62, 86.97], [26.56, 86.94], [26.51, 86.92],
        [26.47, 86.90], [26.44, 86.85], [26.46, 86.80], [26.50, 86.78],
        [26.55, 86.81], [26.60, 86.85], [26.67, 86.90], [26.73, 86.94],
        [26.80, 87.01], [26.86, 87.08], [26.90, 87.14], [26.89, 87.16]
      ],
      // 2. Koshi Eastern Embankment & Inaruwa-Bhantabari Overflow
      [
        [26.65, 86.98], [26.62, 87.12], [26.58, 87.18], [26.52, 87.16],
        [26.48, 87.10], [26.49, 86.95], [26.54, 86.93], [26.65, 86.98]
      ],
      // 3. Morang Keshalya & Singhiya Floodplains (Biratnagar Lowlands)
      [
        [26.42, 87.24], [26.47, 87.25], [26.52, 87.28], [26.50, 87.32],
        [26.44, 87.31], [26.39, 87.27], [26.42, 87.24]
      ],
      // 4. Bagmati & Lalbakeya Deluge Corridor (Rautahat - Gaur / Pipra / Sarlahi)
      [
        [27.15, 85.39], [27.08, 85.36], [27.01, 85.33], [26.94, 85.31],
        [26.87, 85.29], [26.80, 85.27], [26.75, 85.26], [26.74, 85.31],
        [26.78, 85.35], [26.85, 85.38], [26.92, 85.40], [27.00, 85.42],
        [27.08, 85.43], [27.16, 85.42], [27.15, 85.39]
      ],
      // 5. Dhanusha & Siraha Jalad-Kamala Flood Basin (Janakpur Outskirts)
      [
        [26.78, 85.86], [26.75, 85.90], [26.72, 85.95], [26.68, 85.98],
        [26.63, 85.95], [26.65, 85.88], [26.70, 85.84], [26.78, 85.86]
      ],
      // 6. Narayani River Lowland Flood Corridor (Chitwan Madi & Meghauli)
      [
        [27.65, 84.42], [27.60, 84.34], [27.55, 84.25], [27.48, 84.18],
        [27.42, 84.15], [27.38, 84.22], [27.44, 84.30], [27.52, 84.38],
        [27.58, 84.48], [27.65, 84.42]
      ],
      // 7. Tinau River & Bhairahawa Marchawar Plains (Rupandehi)
      [
        [27.58, 83.45], [27.52, 83.43], [27.45, 83.40], [27.38, 83.38],
        [27.34, 83.42], [27.40, 83.48], [27.48, 83.52], [27.56, 83.50],
        [27.58, 83.45]
      ],
      // 8. West Rapti Floodplain Corridor (Banke - Holiya / Betahani / Narainapur)
      [
        [28.12, 81.90], [28.08, 81.82], [28.02, 81.74], [27.96, 81.65],
        [27.90, 81.58], [27.84, 81.52], [27.82, 81.58], [27.88, 81.68],
        [27.95, 81.78], [28.02, 81.88], [28.08, 81.96], [28.12, 81.90]
      ],
      // 9. Babai River Inundation Corridor (Bardiya - Gulariya & Rajapur)
      [
        [28.32, 81.42], [28.25, 81.36], [28.18, 81.30], [28.12, 81.25],
        [28.10, 81.31], [28.16, 81.38], [28.23, 81.44], [28.30, 81.48],
        [28.32, 81.42]
      ],
      // 10. Karnali Delta & Mohana Floodline (Kailali - Tikapur / Dhangadhi)
      [
        [28.60, 81.22], [28.52, 81.18], [28.44, 81.14], [28.36, 81.10],
        [28.34, 81.16], [28.40, 81.22], [28.48, 81.28], [28.56, 81.30],
        [28.60, 81.22]
      ],
      [
        [28.74, 80.68], [28.70, 80.62], [28.65, 80.56], [28.60, 80.50],
        [28.58, 80.55], [28.63, 80.62], [28.68, 80.70], [28.74, 80.74],
        [28.74, 80.68]
      ],
    ],
    safeZones: [
      {
        id: 'safe_barahachhetra',
        name: 'Barahachhetra High Ridge Haven',
        district: 'Sunsari (Eastern)',
        coords: [26.85, 87.15],
        polygon: [
          [26.83, 87.12], [26.88, 87.12], [26.88, 87.18], [26.83, 87.18], [26.83, 87.12]
        ],
        elevationMeters: 285,
        shelterCapacity: 8500,
        contactAgency: 'Nepal Red Cross / District Disaster Management Committee',
      },
      {
        id: 'safe_bharatpur',
        name: 'Bharatpur Elevated Safe Haven Campus',
        district: 'Chitwan (Central)',
        coords: [27.68, 84.43],
        polygon: [
          [27.66, 84.40], [27.71, 84.40], [27.71, 84.46], [27.66, 84.46], [27.66, 84.40]
        ],
        elevationMeters: 210,
        shelterCapacity: 12000,
        contactAgency: 'Chitwan Armed Police Force Base',
      },
      {
        id: 'safe_kohalpur',
        name: 'Kohalpur Evacuation & Relief Hub',
        district: 'Banke (Western)',
        coords: [28.19, 81.69],
        polygon: [
          [28.17, 81.66], [28.22, 81.66], [28.22, 81.72], [28.17, 81.72], [28.17, 81.66]
        ],
        elevationMeters: 182,
        shelterCapacity: 9200,
        contactAgency: 'Mid-Western Emergency Operations Center',
      },
      {
        id: 'safe_attariya',
        name: 'Attariya High Ground Shelter Center',
        district: 'Kailali (Far-Western)',
        coords: [28.82, 80.56],
        polygon: [
          [28.80, 80.53], [28.85, 80.53], [28.85, 80.59], [28.80, 80.59], [28.80, 80.53]
        ],
        elevationMeters: 195,
        shelterCapacity: 6500,
        contactAgency: 'Sudurpashchim Relief Command',
      },
    ],
    settlements: [
      {
        id: 'set_biratnagar',
        name: 'Biratnagar Metropolitan Lowlands',
        district: 'Morang',
        coords: [26.46, 87.27],
        isFlooded: true,
        status: 'SUBMERGED (Severe urban & peri-urban waterlogging)',
        floodDepthMeters: 1.4,
        population: 242000,
        recommendedAction: 'Immediate rubber boat evacuation to Duhabi High Ground',
      },
      {
        id: 'set_inaruwa',
        name: 'Inaruwa Municipality Low Wards',
        district: 'Sunsari',
        coords: [26.60, 87.15],
        isFlooded: true,
        status: 'SUBMERGED (Koshi canal embankment spillover)',
        floodDepthMeters: 1.8,
        population: 63500,
        recommendedAction: 'Direct affected families to Barahachhetra Ridge Camp',
      },
      {
        id: 'set_janakpur',
        name: 'Janakpurdham Southern Ponds & Wards',
        district: 'Dhanusa',
        coords: [26.72, 85.92],
        isFlooded: true,
        status: 'SUBMERGED (Jalad river basin overflow)',
        floodDepthMeters: 1.1,
        population: 173000,
        recommendedAction: 'Deploy emergency pumping units; relocate to Ram Mandir platform',
      },
      {
        id: 'set_gaur',
        name: 'Gaur Border Municipality',
        district: 'Rautahat',
        coords: [26.76, 85.28],
        isFlooded: true,
        status: 'SUBMERGED (Bagmati and Lalbakeya ring dam breaches)',
        floodDepthMeters: 2.2,
        population: 39800,
        recommendedAction: 'Airdrop food & water packets; relocate to Chandranigahapur',
      },
      {
        id: 'set_nepalgunj',
        name: 'Nepalgunj Municipal Suburbs',
        district: 'Banke',
        coords: [28.05, 81.62],
        isFlooded: true,
        status: 'SUBMERGED (Duduwa stream backflow)',
        floodDepthMeters: 1.3,
        population: 166000,
        recommendedAction: 'Evacuate north along Ratna Highway toward Kohalpur Hub',
      },
      {
        id: 'set_dhangadhi',
        name: 'Dhangadhi Southern Riverside Wards',
        district: 'Kailali',
        coords: [28.69, 80.59],
        isFlooded: true,
        status: 'SUBMERGED (Mohana river flash inundation)',
        floodDepthMeters: 1.0,
        population: 147000,
        recommendedAction: 'Relocate to Godawari/Attariya designated relief campus',
      },
      {
        id: 'set_bharatpur_safe',
        name: 'Bharatpur Central Ridge',
        district: 'Chitwan',
        coords: [27.68, 84.43],
        isFlooded: false,
        status: 'SAFE HIGH GROUND (Unaffected elevated terrace)',
        population: 280000,
        recommendedAction: 'Receiving evacuees from Madi and Meghauli lowlands',
      },
      {
        id: 'set_kohalpur_safe',
        name: 'Kohalpur Junction High Ground',
        district: 'Banke',
        coords: [28.19, 81.69],
        isFlooded: false,
        status: 'SAFE HIGH GROUND (Dry terrace campus)',
        population: 87000,
        recommendedAction: 'Operational distribution base for relief convoys',
      },
    ],
  },
  eastern_terai: {
    id: 'eastern_terai',
    name: 'Eastern Terai — Koshi Alluvial River Basin',
    shortName: 'Eastern (Koshi)',
    basin: 'Koshi, Mechi & Kankai River Floodplains',
    districts: ['Jhapa', 'Morang', 'Sunsari', 'Saptari', 'Siraha'],
    center: [26.65, 87.15],
    zoom: 9.3,
    floodAreaKm2: 248.5,
    safeAreaKm2: 7850.0,
    affectedPopulation: 184500,
    deltaDb: -9.1,
    otsuThreshold: -15.4,
    floodPolygons: [
      // 1. Saptakoshi Main Braided River Floodplain (Chatara to Koshi Barrage)
      [
        [26.89, 87.16], [26.85, 87.14], [26.80, 87.10], [26.74, 87.05],
        [26.68, 87.01], [26.62, 86.97], [26.56, 86.94], [26.51, 86.92],
        [26.47, 86.90], [26.44, 86.85], [26.46, 86.80], [26.50, 86.78],
        [26.55, 86.81], [26.60, 86.85], [26.67, 86.90], [26.73, 86.94],
        [26.80, 87.01], [26.86, 87.08], [26.90, 87.14], [26.89, 87.16]
      ],
      // 2. Sunsari Eastern Floodplain & Inaruwa-Bhantabari Corridor
      [
        [26.65, 86.98], [26.62, 87.12], [26.58, 87.18], [26.52, 87.16],
        [26.48, 87.10], [26.49, 86.95], [26.54, 86.93], [26.65, 86.98]
      ],
      // 3. Morang Keshalya Floodplains (Biratnagar Lowlands)
      [
        [26.42, 87.24], [26.47, 87.25], [26.52, 87.28], [26.50, 87.32],
        [26.44, 87.31], [26.39, 87.27], [26.42, 87.24]
      ],
      // 4. Saptari Hanumannagar-Tilathi Western Spillway
      [
        [26.58, 86.85], [26.54, 86.82], [26.50, 86.76], [26.45, 86.72],
        [26.48, 86.70], [26.54, 86.74], [26.58, 86.80], [26.58, 86.85]
      ],
    ],
    safeZones: [
      {
        id: 'safe_barahachhetra',
        name: 'Barahachhetra High Ridge Haven',
        district: 'Sunsari',
        coords: [26.85, 87.15],
        polygon: [
          [26.83, 87.12], [26.88, 87.12], [26.88, 87.18], [26.83, 87.18], [26.83, 87.12]
        ],
        elevationMeters: 285,
        shelterCapacity: 8500,
        contactAgency: 'Nepal Red Cross / District Disaster Management Committee',
      },
      {
        id: 'safe_itahari',
        name: 'Itahari Emergency Command Post',
        district: 'Sunsari',
        coords: [26.66, 87.27],
        polygon: [
          [26.64, 87.25], [26.68, 87.25], [26.68, 87.29], [26.64, 87.29], [26.64, 87.25]
        ],
        elevationMeters: 142,
        shelterCapacity: 6200,
        contactAgency: 'Itahari Municipality First Responders',
      },
    ],
    settlements: [
      {
        id: 'set_biratnagar',
        name: 'Biratnagar Metropolitan Lowlands',
        district: 'Morang',
        coords: [26.46, 87.27],
        isFlooded: true,
        status: 'SUBMERGED (Severe waterlogging)',
        floodDepthMeters: 1.4,
        population: 242000,
        recommendedAction: 'Rubber boat evacuation to Duhabi High Ground',
      },
      {
        id: 'set_inaruwa',
        name: 'Inaruwa Municipality Low Wards',
        district: 'Sunsari',
        coords: [26.60, 87.15],
        isFlooded: true,
        status: 'SUBMERGED (Koshi canal overflow)',
        floodDepthMeters: 1.8,
        population: 63500,
        recommendedAction: 'Relocate families to Barahachhetra Ridge Camp',
      },
      {
        id: 'set_bhantabari',
        name: 'Bhantabari Border Settlement',
        district: 'Sunsari',
        coords: [26.51, 86.86],
        isFlooded: true,
        status: 'SUBMERGED (Koshi Barrage tailwater surge)',
        floodDepthMeters: 2.1,
        population: 14200,
        recommendedAction: 'High priority evacuation along East-West Highway',
      },
      {
        id: 'set_hanumannagar',
        name: 'Hanumannagar Floodplain',
        district: 'Saptari',
        coords: [26.54, 86.82],
        isFlooded: true,
        status: 'SUBMERGED (Saptakoshi riverbank cut)',
        floodDepthMeters: 1.9,
        population: 22800,
        recommendedAction: 'Emergency boat deployment to Rajbiraj Higher Ground',
      },
    ],
  },
  central_terai: {
    id: 'central_terai',
    name: 'Central Terai — Bagmati & Narayani Floodplains',
    shortName: 'Central (Bagmati/Narayani)',
    basin: 'Bagmati, Lalbakeya & Narayani Basin',
    districts: ['Dhanusa', 'Mahottari', 'Sarlahi', 'Rautahat', 'Bara', 'Parsa', 'Chitawan'],
    center: [27.10, 85.10],
    zoom: 9.1,
    floodAreaKm2: 178.6,
    safeAreaKm2: 6920.0,
    affectedPopulation: 132400,
    deltaDb: -8.4,
    otsuThreshold: -15.1,
    floodPolygons: [
      // 1. Bagmati River Deluge Corridor (Chandranigahapur to Gaur Border)
      [
        [27.15, 85.39], [27.08, 85.36], [27.01, 85.33], [26.94, 85.31],
        [26.87, 85.29], [26.80, 85.27], [26.75, 85.26], [26.74, 85.31],
        [26.78, 85.35], [26.85, 85.38], [26.92, 85.40], [27.00, 85.42],
        [27.08, 85.43], [27.16, 85.42], [27.15, 85.39]
      ],
      // 2. Lalbakeya River Dyke Breach Corridor (Garuda to Pipra)
      [
        [27.05, 85.25], [26.98, 85.24], [26.88, 85.22], [26.78, 85.23],
        [26.75, 85.26], [26.82, 85.28], [26.92, 85.29], [27.02, 85.30],
        [27.05, 85.25]
      ],
      // 3. Narayani River Lowland Floodplain (Chitwan Madi & Meghauli)
      [
        [27.65, 84.42], [27.60, 84.34], [27.55, 84.25], [27.48, 84.18],
        [27.42, 84.15], [27.38, 84.22], [27.44, 84.30], [27.52, 84.38],
        [27.58, 84.48], [27.65, 84.42]
      ],
      // 4. Dhanusha Jalad Basin (Janakpur Suburbs)
      [
        [26.78, 85.86], [26.75, 85.90], [26.72, 85.95], [26.68, 85.98],
        [26.63, 85.95], [26.65, 85.88], [26.70, 85.84], [26.78, 85.86]
      ],
    ],
    safeZones: [
      {
        id: 'safe_bharatpur',
        name: 'Bharatpur Elevated Safe Haven Campus',
        district: 'Chitwan',
        coords: [27.68, 84.43],
        polygon: [
          [27.66, 84.40], [27.71, 84.40], [27.71, 84.46], [27.66, 84.46], [27.66, 84.40]
        ],
        elevationMeters: 210,
        shelterCapacity: 12000,
        contactAgency: 'Chitwan Armed Police Force Base',
      },
      {
        id: 'safe_chandranigahapur',
        name: 'Chandranigahapur Highway High Ground',
        district: 'Rautahat',
        coords: [27.12, 85.34],
        polygon: [
          [27.10, 85.32], [27.14, 85.32], [27.14, 85.36], [27.10, 85.36], [27.10, 85.32]
        ],
        elevationMeters: 175,
        shelterCapacity: 7500,
        contactAgency: 'Rautahat District Disaster Office',
      },
    ],
    settlements: [
      {
        id: 'set_gaur',
        name: 'Gaur Border Municipality',
        district: 'Rautahat',
        coords: [26.76, 85.28],
        isFlooded: true,
        status: 'SUBMERGED (Ring dam breached by Bagmati)',
        floodDepthMeters: 2.2,
        population: 39800,
        recommendedAction: 'Airdrop rations; evacuate to Chandranigahapur',
      },
      {
        id: 'set_janakpur',
        name: 'Janakpurdham Southern Ponds & Wards',
        district: 'Dhanusa',
        coords: [26.72, 85.92],
        isFlooded: true,
        status: 'SUBMERGED (Jalad river overflow)',
        floodDepthMeters: 1.1,
        population: 173000,
        recommendedAction: 'Relocate families to elevated school campuses',
      },
      {
        id: 'set_madi',
        name: 'Madi Valley Lowlands',
        district: 'Chitwan',
        coords: [27.42, 84.35],
        isFlooded: true,
        status: 'SUBMERGED (Riu river flash inundation)',
        floodDepthMeters: 1.5,
        population: 28400,
        recommendedAction: 'Direct families to Basantapur Elevated School',
      },
    ],
  },
  western_terai: {
    id: 'western_terai',
    name: 'Western Terai — West Rapti & Karnali Lowlands',
    shortName: 'Western (West Rapti)',
    basin: 'West Rapti, Babai & Tinau Basins',
    districts: ['Nawalparasi East', 'Nawalparasi West', 'Rupandehi', 'Kapilbastu', 'Dang', 'Banke', 'Bardiya'],
    center: [28.05, 81.75],
    zoom: 9.1,
    floodAreaKm2: 138.2,
    safeAreaKm2: 5980.0,
    affectedPopulation: 76500,
    deltaDb: -9.4,
    otsuThreshold: -15.8,
    floodPolygons: [
      // 1. West Rapti River Floodplain (Banke - Holiya / Betahani / Narainapur)
      [
        [28.12, 81.90], [28.08, 81.82], [28.02, 81.74], [27.96, 81.65],
        [27.90, 81.58], [27.84, 81.52], [27.82, 81.58], [27.88, 81.68],
        [27.95, 81.78], [28.02, 81.88], [28.08, 81.96], [28.12, 81.90]
      ],
      // 2. Babai River Floodplain (Bardiya - Gulariya & Rajapur)
      [
        [28.32, 81.42], [28.25, 81.36], [28.18, 81.30], [28.12, 81.25],
        [28.10, 81.31], [28.16, 81.38], [28.23, 81.44], [28.30, 81.48],
        [28.32, 81.42]
      ],
      // 3. Tinau River Lowlands (Rupandehi - Bhairahawa / Marchawar)
      [
        [27.58, 83.45], [27.52, 83.43], [27.45, 83.40], [27.38, 83.38],
        [27.34, 83.42], [27.40, 83.48], [27.48, 83.52], [27.56, 83.50],
        [27.58, 83.45]
      ],
    ],
    safeZones: [
      {
        id: 'safe_kohalpur',
        name: 'Kohalpur Evacuation & Relief Hub',
        district: 'Banke',
        coords: [28.19, 81.69],
        polygon: [
          [28.17, 81.66], [28.22, 81.66], [28.22, 81.72], [28.17, 81.72], [28.17, 81.66]
        ],
        elevationMeters: 182,
        shelterCapacity: 9200,
        contactAgency: 'Mid-Western Emergency Operations Center',
      },
      {
        id: 'safe_butwal',
        name: 'Butwal Foothill Refuge Campus',
        district: 'Rupandehi',
        coords: [27.70, 83.46],
        polygon: [
          [27.68, 83.44], [27.72, 83.44], [27.72, 83.48], [27.68, 83.48], [27.68, 83.44]
        ],
        elevationMeters: 205,
        shelterCapacity: 10500,
        contactAgency: 'Rupandehi Red Cross Shelter Command',
      },
    ],
    settlements: [
      {
        id: 'set_nepalgunj',
        name: 'Nepalgunj Municipal Suburbs',
        district: 'Banke',
        coords: [28.05, 81.62],
        isFlooded: true,
        status: 'SUBMERGED (Duduwa stream overflow)',
        floodDepthMeters: 1.3,
        population: 166000,
        recommendedAction: 'Evacuate toward Kohalpur Hub via Ratna Highway',
      },
      {
        id: 'set_raptisonari',
        name: 'Raptisonari Rural Municipality',
        district: 'Banke',
        coords: [28.10, 81.75],
        isFlooded: true,
        status: 'SUBMERGED (Rapti riverbank breach)',
        floodDepthMeters: 2.0,
        population: 41200,
        recommendedAction: 'Urgent boat extraction to Kusum High Embankment',
      },
      {
        id: 'set_lumbini',
        name: 'Lumbini Cultural Plains Lowlands',
        district: 'Rupandehi',
        coords: [27.48, 83.28],
        isFlooded: true,
        status: 'SUBMERGED (Tinau river distributary pooling)',
        floodDepthMeters: 0.9,
        population: 32000,
        recommendedAction: 'Relocate to Peace Garden high platforms',
      },
    ],
  },
  far_western_terai: {
    id: 'far_western_terai',
    name: 'Far-Western Terai — Mahakali & Mohana Corridor',
    shortName: 'Far-Western (Mahakali)',
    basin: 'Mahakali & Mohana River Basins',
    districts: ['Kailali', 'Kanchanpur'],
    center: [28.75, 80.60],
    zoom: 9.3,
    floodAreaKm2: 77.5,
    safeAreaKm2: 2400.0,
    affectedPopulation: 35200,
    deltaDb: -8.9,
    otsuThreshold: -15.0,
    floodPolygons: [
      // 1. Karnali Delta & Tikapur/Bhajani Flood Corridor
      [
        [28.60, 81.22], [28.52, 81.18], [28.44, 81.14], [28.36, 81.10],
        [28.34, 81.16], [28.40, 81.22], [28.48, 81.28], [28.56, 81.30],
        [28.60, 81.22]
      ],
      // 2. Mohana River & Dhangadhi Lowland Border Corridor
      [
        [28.74, 80.68], [28.70, 80.62], [28.65, 80.56], [28.60, 80.50],
        [28.58, 80.55], [28.63, 80.62], [28.68, 80.70], [28.74, 80.74],
        [28.74, 80.68]
      ],
      // 3. Dodhara-Chandani Mahakali River Floodplain
      [
        [28.94, 80.12], [28.90, 80.08], [28.84, 80.06], [28.82, 80.10],
        [28.88, 80.14], [28.94, 80.12]
      ],
    ],
    safeZones: [
      {
        id: 'safe_attariya',
        name: 'Attariya High Ground Shelter Center',
        district: 'Kailali',
        coords: [28.82, 80.56],
        polygon: [
          [28.80, 80.53], [28.85, 80.53], [28.85, 80.59], [28.80, 80.59], [28.80, 80.53]
        ],
        elevationMeters: 195,
        shelterCapacity: 6500,
        contactAgency: 'Sudurpashchim Relief Command',
      },
      {
        id: 'safe_mahendranagar',
        name: 'Mahendranagar Elevated Sports Campus',
        district: 'Kanchanpur',
        coords: [28.98, 80.18],
        polygon: [
          [28.96, 80.16], [29.00, 80.16], [29.00, 80.20], [28.96, 80.20], [28.96, 80.16]
        ],
        elevationMeters: 202,
        shelterCapacity: 5800,
        contactAgency: 'Kanchanpur District Red Cross',
      },
    ],
    settlements: [
      {
        id: 'set_dhangadhi',
        name: 'Dhangadhi Southern Riverside Wards',
        district: 'Kailali',
        coords: [28.69, 80.59],
        isFlooded: true,
        status: 'SUBMERGED (Mohana river backwater inundation)',
        floodDepthMeters: 1.1,
        population: 147000,
        recommendedAction: 'Relocate north to Godawari/Attariya High Ground',
      },
      {
        id: 'set_dodhara',
        name: 'Dodhara Chandani Trans-Mahakali Wards',
        district: 'Kanchanpur',
        coords: [28.88, 80.08],
        isFlooded: true,
        status: 'SUBMERGED (Mahakali river overflow cut-off)',
        floodDepthMeters: 1.6,
        population: 39500,
        recommendedAction: 'Army boat transfer across suspension bridge route',
      },
    ],
  },
};
