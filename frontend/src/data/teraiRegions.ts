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
    center: [27.35, 84.15],
    zoom: 7.7,
    floodAreaKm2: 642.8,
    safeAreaKm2: 23150.0,
    affectedPopulation: 428600,
    deltaDb: -8.8,
    otsuThreshold: -15.2,
    floodPolygons: [
      // Eastern Terai Koshi plume
      [
        [26.42, 86.78], [26.82, 86.82], [26.92, 87.32], [26.68, 87.42], [26.42, 87.12], [26.42, 86.78]
      ],
      // Central Terai Bagmati/Narayani plume
      [
        [26.78, 85.18], [27.12, 85.28], [27.02, 85.82], [26.68, 85.72], [26.78, 85.18]
      ],
      // Western Terai West Rapti plume
      [
        [27.88, 81.38], [28.22, 81.42], [28.28, 81.88], [27.92, 81.82], [27.88, 81.38]
      ],
      // Far-Western Terai Kailali/Mohana plume
      [
        [28.52, 80.48], [28.78, 80.52], [28.82, 80.85], [28.58, 80.82], [28.52, 80.48]
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
      [
        [26.42, 86.78], [26.82, 86.82], [26.92, 87.32], [26.68, 87.42], [26.42, 87.12], [26.42, 86.78]
      ],
      [
        [26.54, 87.02], [26.72, 87.05], [26.70, 87.22], [26.50, 87.20], [26.54, 87.02]
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
      [
        [26.78, 85.18], [27.12, 85.28], [27.02, 85.82], [26.68, 85.72], [26.78, 85.18]
      ],
      [
        [27.42, 84.18], [27.62, 84.22], [27.60, 84.52], [27.38, 84.45], [27.42, 84.18]
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
      [
        [27.88, 81.38], [28.22, 81.42], [28.28, 81.88], [27.92, 81.82], [27.88, 81.38]
      ],
      [
        [27.52, 83.18], [27.75, 83.22], [27.72, 83.58], [27.48, 83.52], [27.52, 83.18]
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
      [
        [28.52, 80.48], [28.78, 80.52], [28.82, 80.85], [28.58, 80.82], [28.52, 80.48]
      ],
      [
        [28.85, 80.12], [29.05, 80.15], [29.02, 80.35], [28.82, 80.32], [28.85, 80.12]
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
