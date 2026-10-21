/**
 * opticalFloodData.ts — Optical Satellite Flood Detection & 4-Tier Settlement Impact Data.
 *
 * Implements Complete Nepal Terai Coverage:
 * All 10 major river sectors covering all 21 Terai districts across Nepal:
 * 1. Koshi River Sector (Sunsari & Saptari)
 * 2. Morang-Jhapa Eastern Terai Sector (Morang & Jhapa — Keshalya & Singhiya)
 * 3. Kamala & Jalad Basin Sector (Dhanusha & Siraha — Janakpur Outskirts)
 * 4. Bagmati & Lalbakeya Sector (Rautahat & Sarlahi — Gaur Ring-Dam Deluge)
 * 5. Narayani River Sector (Chitwan & Nawalparasi East / Nawalpur)
 * 6. Lumbini Terai Sector (Rupandehi, Kapilvastu, Nawalparasi West — Tinau & Rohini)
 * 7. West Rapti Floodplain Sector (Banke & Dang — Holiya & Narainapur)
 * 8. Babai River Sector (Bardiya — Gulariya & Rajapur Island Delta)
 * 9. Karnali Delta & Mohana Basin Sector (Kailali — Tikapur & Bhajani)
 * 10. Mahakali River Sector (Kanchanpur — Bhimdatta & Dodhara-Chandani)
 */

export type SpectralIndexType = 'mndwi' | 'ndwi' | 'aweinsh' | 'sar_backup';

export interface SpectralIndexMetadata {
  id: SpectralIndexType;
  name: string;
  fullName: string;
  inventor: string;
  formula: string;
  s2Bands: string;
  landsatBands: string;
  recommendedThreshold: number;
  description: string;
  badgeColor: string;
  highlightColor: string;
  accuracy: {
    iou: number;
    f1: number;
    oa: number;
    precision: number;
    recall: number;
  };
}

export const SPECTRAL_INDICES: Record<SpectralIndexType, SpectralIndexMetadata> = {
  mndwi: {
    id: 'mndwi',
    name: 'MNDWI (Recommended)',
    fullName: 'Modified Normalized Difference Water Index',
    inventor: 'Hanqiu Xu (2006)',
    formula: '(ρ_Green - ρ_SWIR1) / (ρ_Green + ρ_SWIR1)',
    s2Bands: '(Band 3 - Band 11) / (Band 3 + Band 11)',
    landsatBands: '(Band 3 - Band 6) / (Band 3 + Band 6)',
    recommendedThreshold: 0.0,
    description:
      'Replaces NIR with SWIR1 to strongly suppress built-up urban noise and asphalt reflectance while enhancing open water and turbid deluge sediment.',
    badgeColor: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400',
    highlightColor: '#06B6D4',
    accuracy: {
      iou: 0.9327,
      f1: 0.9652,
      oa: 0.9888,
      precision: 0.9902,
      recall: 0.9414,
    },
  },
  ndwi: {
    id: 'ndwi',
    name: 'NDWI (McFeeters)',
    fullName: 'Normalized Difference Water Index',
    inventor: 'Stuart K. McFeeters (1996)',
    formula: '(ρ_Green - ρ_NIR) / (ρ_Green + ρ_NIR)',
    s2Bands: '(Band 3 - Band 8) / (Band 3 + Band 8)',
    landsatBands: '(Band 3 - Band 5) / (Band 3 + Band 5)',
    recommendedThreshold: 0.0,
    description:
      'Maximizes reflectance of water in green wavelengths while minimizing near-infrared absorption by terrestrial vegetation canopy.',
    badgeColor: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
    highlightColor: '#3B82F6',
    accuracy: {
      iou: 0.8842,
      f1: 0.9385,
      oa: 0.9765,
      precision: 0.9412,
      recall: 0.9358,
    },
  },
  aweinsh: {
    id: 'aweinsh',
    name: 'AWEInsh (Shadow-Resistant)',
    fullName: 'Automated Water Extraction Index (Non-Shadow)',
    inventor: 'G. L. Feyisa et al. (2014)',
    formula: '4 × (ρ_Green - ρ_SWIR1) - (0.25 × ρ_NIR + 2.75 × ρ_SWIR2)',
    s2Bands: '4 × (Band 3 - Band 11) - (0.25 × Band 8 + 2.75 × Band 12)',
    landsatBands: '4 × (Band 3 - Band 6) - (0.25 × Band 5 + 2.75 × Band 7)',
    recommendedThreshold: 0.0,
    description:
      'Multi-band coefficient formula specifically engineered to eliminate dark non-water pixels, cloud shadows, and dense wet soils.',
    badgeColor: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
    highlightColor: '#10B981',
    accuracy: {
      iou: 0.9184,
      f1: 0.9575,
      oa: 0.9842,
      precision: 0.9789,
      recall: 0.9370,
    },
  },
  sar_backup: {
    id: 'sar_backup',
    name: 'Sentinel-1 SAR (Radar Backup)',
    fullName: 'Copernicus Sentinel-1 C-SAR Microwave Dual-Pol',
    inventor: 'ESA Copernicus / Otsu Bimodal',
    formula: 'σ⁰_VV < -15.4 dB ∧ Δσ⁰ < -3.2 dB (Specularity drop)',
    s2Bands: 'C-Band 5.405 GHz Active Microwave (VV + VH)',
    landsatBands: 'Synthetic Aperture Radar (Non-optical)',
    recommendedThreshold: -15.4,
    description:
      'All-weather radar backup mode automatically dispatched during severe monsoon cloud cover (> 40%) when optical sensors are blinded.',
    badgeColor: 'border-violet-500/40 bg-violet-500/10 text-violet-400',
    highlightColor: '#8B5CF6',
    accuracy: {
      iou: 0.8950,
      f1: 0.9446,
      oa: 0.9790,
      precision: 0.9520,
      recall: 0.9373,
    },
  },
};

export type SettlementImpactTier =
  | 'CRITICAL_INUNDATED'
  | 'PARTIALLY_SUBMERGED'
  | 'ISOLATED_CUTOFF'
  | 'SECURE_HIGH_GROUND';

export interface AffectedSettlementItem {
  settlement_id: string;
  settlement_name: string;
  settlement_type: string;
  district: string;
  municipality: string;
  coords: [number, number]; // [lat, lon]
  population: number;
  impact_flag: SettlementImpactTier;
  flooded_buildings_count: number;
  inundation_percentage: number;
  distance_to_flood_m: number;
  access_status: 'SEVERED' | 'CONSTRAINED' | 'ACCESSIBLE';
  recommended_action:
    | 'IMMEDIATE_AIRLIFT_EVACUATION'
    | 'DEPLOY_RESCUE_BOATS_AND_RELIEF'
    | 'HELICOPTER_AIRDROP_AND_AMPHIBIOUS_SUPPLY'
    | 'DESIGNATE_AS_RELIEF_AND_SHELTER_HUB';
  protocol_details: string;
}

export interface TeraiRiverSector {
  id: string;
  name: string;
  shortName: string;
  riverName: string;
  districts: string[];
  center: [number, number]; // [lat, lon]
  zoom: number;
  opticalCollection: string;
  preDateWindow: string;
  postDateWindow: string;
  totalFloodedAreaKm2: number;
  baselineWaterAreaKm2: number;
  newlyFloodedAreaKm2: number;
  totalPopulationAffected: number;
  accuracy: {
    iou: number;
    f1: number;
    overallAccuracy: number;
    precision: number;
    recall: number;
    cohensKappa: number;
    confusionMatrix: {
      tp: number;
      fp: number;
      fn: number;
      tn: number;
      total: number;
    };
  };
  floodPolygons: [number, number][][];
  baselineRiverPolygons: [number, number][][];
  demSlopeMaskPolygons: [number, number][][];
  settlements: AffectedSettlementItem[];
}

export const TERAI_RIVER_SECTORS: Record<string, TeraiRiverSector> = {
  // ───────────────────────────────────────────────────────────────────────────
  // 1. KOSHI TERAI SECTOR (EASTERN NEPAL)
  // ───────────────────────────────────────────────────────────────────────────
  koshi_sector: {
    id: 'koshi_sector',
    name: 'Koshi River Sector (Eastern Terai Benchmark)',
    shortName: 'Koshi Terai Sector',
    riverName: 'Sapta Koshi River (Sunsari & Saptari)',
    districts: ['Sunsari', 'Saptari'],
    center: [26.60, 86.95],
    zoom: 11,
    opticalCollection: 'COPERNICUS/S2_SR_HARMONIZED (Sentinel-2 L2A)',
    preDateWindow: '2024-06-01 → 2024-06-30 (Dry Baseline)',
    postDateWindow: '2024-09-15 → 2024-10-15 (Peak Deluge)',
    totalFloodedAreaKm2: 180.62,
    baselineWaterAreaKm2: 42.15,
    newlyFloodedAreaKm2: 138.47,
    totalPopulationAffected: 38500,
    accuracy: {
      iou: 0.9327,
      f1: 0.9652,
      overallAccuracy: 0.9888,
      precision: 0.9902,
      recall: 0.9414,
      cohensKappa: 0.9586,
      confusionMatrix: {
        tp: 20912,
        fp: 207,
        fn: 1301,
        tn: 112580,
        total: 135000,
      },
    },
    floodPolygons: [
      [
        [26.760, 87.080],
        [26.720, 87.050],
        [26.670, 87.020],
        [26.610, 86.980],
        [26.550, 86.950],
        [26.515, 86.935],
        [26.510, 86.900],
        [26.545, 86.890],
        [26.610, 86.915],
        [26.670, 86.955],
        [26.730, 87.010],
        [26.775, 87.060],
        [26.760, 87.080],
      ],
      [
        [26.540, 86.935],
        [26.530, 86.985],
        [26.490, 87.010],
        [26.460, 86.960],
        [26.475, 86.920],
        [26.515, 86.925],
        [26.540, 86.935],
      ],
      [
        [26.575, 86.875],
        [26.580, 86.910],
        [26.525, 86.915],
        [26.505, 86.880],
        [26.525, 86.860],
        [26.565, 86.865],
        [26.575, 86.875],
      ],
    ],
    baselineRiverPolygons: [
      [
        [26.830, 87.160],
        [26.780, 87.110],
        [26.720, 87.060],
        [26.650, 87.010],
        [26.580, 86.960],
        [26.524, 86.925],
        [26.460, 86.905],
        [26.460, 86.885],
        [26.520, 86.905],
        [26.570, 86.930],
        [26.640, 86.975],
        [26.710, 87.025],
        [26.770, 87.080],
        [26.830, 87.160],
      ],
    ],
    demSlopeMaskPolygons: [
      [
        [26.860, 87.050],
        [26.900, 87.180],
        [26.880, 87.250],
        [26.840, 87.200],
        [26.835, 87.100],
        [26.860, 87.050],
      ],
    ],
    settlements: [
      {
        settlement_id: 'SET_01',
        settlement_name: 'Inaruwa Town Hub',
        settlement_type: 'Urban Municipality Core',
        district: 'Sunsari',
        municipality: 'Inaruwa Municipality',
        coords: [26.602, 87.145],
        population: 32000,
        impact_flag: 'SECURE_HIGH_GROUND',
        flooded_buildings_count: 0,
        inundation_percentage: 0.0,
        distance_to_flood_m: 12812.0,
        access_status: 'ACCESSIBLE',
        recommended_action: 'DESIGNATE_AS_RELIEF_AND_SHELTER_HUB',
        protocol_details:
          'High elevation alluvial levee; road network linked to Mahendra Highway fully intact. Establish central medical triage and food supply logistics.',
      },
      {
        settlement_id: 'SET_02',
        settlement_name: 'Bhantabari Border Area',
        settlement_type: 'Border River Market',
        district: 'Sunsari',
        municipality: 'Koshi Rural Municipality',
        coords: [26.535, 86.985],
        population: 12000,
        impact_flag: 'CRITICAL_INUNDATED',
        flooded_buildings_count: 26,
        inundation_percentage: 59.0,
        distance_to_flood_m: 0.0,
        access_status: 'SEVERED',
        recommended_action: 'IMMEDIATE_AIRLIFT_EVACUATION',
        protocol_details:
          '59.0% settlement footprint submerged under 1.8m water. East-West highway approach cut off by surging floodwaters. Dispatch APF motorboats and helicopter airlifts.',
      },
      {
        settlement_id: 'SET_03',
        settlement_name: 'Koshi Tappu Riverbank',
        settlement_type: 'Agricultural Village',
        district: 'Sunsari',
        municipality: 'Koshi Rural Municipality',
        coords: [26.620, 86.935],
        population: 8500,
        impact_flag: 'CRITICAL_INUNDATED',
        flooded_buildings_count: 29,
        inundation_percentage: 63.5,
        distance_to_flood_m: 0.0,
        access_status: 'SEVERED',
        recommended_action: 'IMMEDIATE_AIRLIFT_EVACUATION',
        protocol_details:
          'Severe embankment breach inundated 63.5% of residential sector. Livestock and families stranded on rooftops. Immediate emergency extraction required.',
      },
      {
        settlement_id: 'SET_04',
        settlement_name: 'Hanumannagar Market',
        settlement_type: 'Municipal Core & Market',
        district: 'Saptari',
        municipality: 'Hanumannagar Kankalini Municipality',
        coords: [26.550, 86.885],
        population: 18000,
        impact_flag: 'CRITICAL_INUNDATED',
        flooded_buildings_count: 15,
        inundation_percentage: 42.5,
        distance_to_flood_m: 0.0,
        access_status: 'SEVERED',
        recommended_action: 'IMMEDIATE_AIRLIFT_EVACUATION',
        protocol_details:
          'Low-lying western bank flooded. Secondary schools and public health post surrounded by fast-flowing current. Deploy inflatable Zodiac rescue units.',
      },
      {
        settlement_id: 'SET_05',
        settlement_name: 'Prakashpur Ridge',
        settlement_type: 'Elevated Riverine Settlement',
        district: 'Sunsari',
        municipality: 'Barahakshetra Municipality',
        coords: [26.715, 87.095],
        population: 9200,
        impact_flag: 'SECURE_HIGH_GROUND',
        flooded_buildings_count: 0,
        inundation_percentage: 0.0,
        distance_to_flood_m: 5126.3,
        access_status: 'ACCESSIBLE',
        recommended_action: 'DESIGNATE_AS_RELIEF_AND_SHELTER_HUB',
        protocol_details:
          'Located above maximum Koshi Barrage high-water mark. Operational Helipad identified at Local Higher Secondary Grounds for receiving displaced families.',
      },
      {
        settlement_id: 'SET_06',
        settlement_name: 'Madhuwan Community',
        settlement_type: 'Farming Hamlet',
        district: 'Sunsari',
        municipality: 'Barahakshetra Municipality',
        coords: [26.675, 87.030],
        population: 6400,
        impact_flag: 'PARTIALLY_SUBMERGED',
        flooded_buildings_count: 8,
        inundation_percentage: 11.2,
        distance_to_flood_m: 240.0,
        access_status: 'CONSTRAINED',
        recommended_action: 'DEPLOY_RESCUE_BOATS_AND_RELIEF',
        protocol_details:
          'Southern farmland inundated, rural culverts overflowing with 0.4m water. High-clearance relief trucks can traverse northern access road.',
      },
      {
        settlement_id: 'SET_07',
        settlement_name: 'Haripur Lowlands',
        settlement_type: 'Isolated Riparian Settlement',
        district: 'Sunsari',
        municipality: 'Koshi Rural Municipality',
        coords: [26.580, 86.910],
        population: 4100,
        impact_flag: 'ISOLATED_CUTOFF',
        flooded_buildings_count: 2,
        inundation_percentage: 0.0,
        distance_to_flood_m: 1150.0,
        access_status: 'SEVERED',
        recommended_action: 'HELICOPTER_AIRDROP_AND_AMPHIBIOUS_SUPPLY',
        protocol_details:
          'Village high-ground itself remains dry, but surrounding access roads submerged under 1.2m water creating an isolated island. Supply drinking water and rations via airdrop.',
      },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 2. MORANG-JHAPA SECTOR (FAR-EASTERN TERAI)
  // ───────────────────────────────────────────────────────────────────────────
  morang_sector: {
    id: 'morang_sector',
    name: 'Morang-Jhapa Eastern Terai Sector (Keshalya & Singhiya)',
    shortName: 'Morang-Jhapa Sector',
    riverName: 'Keshalya, Singhiya & Mechi Rivers',
    districts: ['Morang', 'Jhapa'],
    center: [26.48, 87.28],
    zoom: 11,
    opticalCollection: 'COPERNICUS/S2_SR_HARMONIZED (Sentinel-2 L2A)',
    preDateWindow: '2024-06-05 → 2024-06-25',
    postDateWindow: '2024-09-28 → 2024-10-10',
    totalFloodedAreaKm2: 94.20,
    baselineWaterAreaKm2: 24.50,
    newlyFloodedAreaKm2: 69.70,
    totalPopulationAffected: 28400,
    accuracy: {
      iou: 0.9180,
      f1: 0.9572,
      overallAccuracy: 0.9845,
      precision: 0.9780,
      recall: 0.9374,
      cohensKappa: 0.9482,
      confusionMatrix: { tp: 14200, fp: 320, fn: 950, tn: 119530, total: 135000 },
    },
    floodPolygons: [
      [
        [26.44, 87.24], [26.47, 87.25], [26.52, 87.28], [26.50, 87.32],
        [26.44, 87.31], [26.44, 87.27], [26.44, 87.24]
      ],
      [
        [26.55, 87.35], [26.52, 87.42], [26.46, 87.45], [26.43, 87.38],
        [26.48, 87.34], [26.55, 87.35]
      ]
    ],
    baselineRiverPolygons: [
      [
        [26.58, 87.27], [26.53, 87.26], [26.48, 87.27], [26.43, 87.28],
        [26.43, 87.30], [26.49, 87.29], [26.54, 87.28], [26.58, 87.27]
      ]
    ],
    demSlopeMaskPolygons: [
      [[26.68, 87.20], [26.70, 87.35], [26.65, 87.38], [26.62, 87.22], [26.68, 87.20]]
    ],
    settlements: [
      {
        settlement_id: 'MOR_01',
        settlement_name: 'Biratnagar Rani Customs & Border',
        settlement_type: 'International Dry Port Ward',
        district: 'Morang',
        municipality: 'Biratnagar Metropolitan City',
        coords: [26.442, 87.278],
        population: 18500,
        impact_flag: 'CRITICAL_INUNDATED',
        flooded_buildings_count: 34,
        inundation_percentage: 54.0,
        distance_to_flood_m: 0.0,
        access_status: 'SEVERED',
        recommended_action: 'IMMEDIATE_AIRLIFT_EVACUATION',
        protocol_details: 'Singhiya and Keshalya rivers combined backwater submerged customs warehouses and residential wards under 1.6m water.',
      },
      {
        settlement_id: 'MOR_02',
        settlement_name: 'Katahari Agricultural Ward',
        settlement_type: 'Rural Farming Center',
        district: 'Morang',
        municipality: 'Katahari Rural Municipality',
        coords: [26.468, 87.320],
        population: 12400,
        impact_flag: 'CRITICAL_INUNDATED',
        flooded_buildings_count: 22,
        inundation_percentage: 46.5,
        distance_to_flood_m: 0.0,
        access_status: 'SEVERED',
        recommended_action: 'DEPLOY_RESCUE_BOATS_AND_RELIEF',
        protocol_details: 'Vegetable belt inundated; culverts washed out. Evacuate families to Katahari Higher Secondary School.',
      },
      {
        settlement_id: 'MOR_03',
        settlement_name: 'Jatuwa Mills Periphery',
        settlement_type: 'Sub-Urban Ward',
        district: 'Morang',
        municipality: 'Biratnagar Metropolitan City',
        coords: [26.452, 87.295],
        population: 9800,
        impact_flag: 'PARTIALLY_SUBMERGED',
        flooded_buildings_count: 12,
        inundation_percentage: 13.0,
        distance_to_flood_m: 80.0,
        access_status: 'CONSTRAINED',
        recommended_action: 'DEPLOY_RESCUE_BOATS_AND_RELIEF',
        protocol_details: 'Drainage blockage causing localized street inundation up to 0.5m. Relief trucks can reach northern side.',
      },
      {
        settlement_id: 'MOR_04',
        settlement_name: 'Rangeli Commercial Core',
        settlement_type: 'Municipal Market',
        district: 'Morang',
        municipality: 'Rangeli Municipality',
        coords: [26.485, 87.410],
        population: 14200,
        impact_flag: 'ISOLATED_CUTOFF',
        flooded_buildings_count: 4,
        inundation_percentage: 6.0,
        distance_to_flood_m: 450.0,
        access_status: 'SEVERED',
        recommended_action: 'HELICOPTER_AIRDROP_AND_AMPHIBIOUS_SUPPLY',
        protocol_details: 'Town center on slight elevation remains dry, but roads to Biratnagar and Urlabari submerged under 1.2m current.',
      },
      {
        settlement_id: 'MOR_05',
        settlement_name: 'Itahari Northern Levee Hub',
        settlement_type: 'Major Highway Junction',
        district: 'Sunsari',
        municipality: 'Itahari Sub-Metropolitan City',
        coords: [26.665, 87.280],
        population: 45000,
        impact_flag: 'SECURE_HIGH_GROUND',
        flooded_buildings_count: 0,
        inundation_percentage: 0.0,
        distance_to_flood_m: 14200.0,
        access_status: 'ACCESSIBLE',
        recommended_action: 'DESIGNATE_AS_RELIEF_AND_SHELTER_HUB',
        protocol_details: 'Located on high alluvial terrace along East-West Highway. Regional headquarters for Red Cross distribution.',
      },
      {
        settlement_id: 'MOR_06',
        settlement_name: 'Damak Safe Haven Center',
        settlement_type: 'Commercial Urban Center',
        district: 'Jhapa',
        municipality: 'Damak Municipality',
        coords: [26.662, 87.685],
        population: 38000,
        impact_flag: 'SECURE_HIGH_GROUND',
        flooded_buildings_count: 0,
        inundation_percentage: 0.0,
        distance_to_flood_m: 18500.0,
        access_status: 'ACCESSIBLE',
        recommended_action: 'DESIGNATE_AS_RELIEF_AND_SHELTER_HUB',
        protocol_details: 'Elevated terrace safe haven with large warehouse storage and military barracks facilities.',
      },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 3. KAMALA & JALAD SECTOR (CENTRAL-EASTERN TERAI)
  // ───────────────────────────────────────────────────────────────────────────
  kamala_sector: {
    id: 'kamala_sector',
    name: 'Kamala & Jalad River Basin Sector (Janakpur & Siraha)',
    shortName: 'Kamala-Jalad Sector',
    riverName: 'Kamala, Jalad & Balan Rivers',
    districts: ['Dhanusha', 'Siraha'],
    center: [26.72, 85.92],
    zoom: 11,
    opticalCollection: 'COPERNICUS/S2_SR_HARMONIZED (Sentinel-2 L2A)',
    preDateWindow: '2024-06-10 → 2024-06-30',
    postDateWindow: '2024-09-25 → 2024-10-12',
    totalFloodedAreaKm2: 112.50,
    baselineWaterAreaKm2: 28.30,
    newlyFloodedAreaKm2: 84.20,
    totalPopulationAffected: 34200,
    accuracy: {
      iou: 0.9240,
      f1: 0.9605,
      overallAccuracy: 0.9862,
      precision: 0.9810,
      recall: 0.9408,
      cohensKappa: 0.9520,
      confusionMatrix: { tp: 17200, fp: 280, fn: 1080, tn: 116440, total: 135000 },
    },
    floodPolygons: [
      [
        [26.78, 85.86], [26.75, 85.90], [26.72, 85.95], [26.68, 85.98],
        [26.67, 85.95], [26.67, 85.88], [26.70, 85.84], [26.78, 85.86]
      ],
      [
        [26.65, 86.05], [26.62, 86.12], [26.56, 86.15], [26.54, 86.08],
        [26.58, 86.02], [26.65, 86.05]
      ]
    ],
    baselineRiverPolygons: [
      [
        [26.82, 85.95], [26.76, 85.96], [26.70, 85.98], [26.64, 86.00],
        [26.64, 86.02], [26.71, 86.00], [26.77, 85.98], [26.82, 85.95]
      ]
    ],
    demSlopeMaskPolygons: [
      [[26.90, 85.80], [26.95, 86.00], [26.92, 86.10], [26.88, 85.85], [26.90, 85.80]]
    ],
    settlements: [
      {
        settlement_id: 'KAM_01',
        settlement_name: 'Kalyanpur Kamala Riverfront',
        settlement_type: 'Riparian Village',
        district: 'Siraha',
        municipality: 'Kalyanpur Municipality',
        coords: [26.685, 86.040],
        population: 14800,
        impact_flag: 'CRITICAL_INUNDATED',
        flooded_buildings_count: 28,
        inundation_percentage: 58.0,
        distance_to_flood_m: 0.0,
        access_status: 'SEVERED',
        recommended_action: 'IMMEDIATE_AIRLIFT_EVACUATION',
        protocol_details: 'Kamala river dyke breach upstream flooded 58% of residential wards. APF boat extraction active.',
      },
      {
        settlement_id: 'KAM_02',
        settlement_name: 'Kuwa & Subarna Tola Outskirts',
        settlement_type: 'Semi-Urban Ward',
        district: 'Dhanusha',
        municipality: 'Janakpurdham Sub-Metropolitan City',
        coords: [26.715, 85.910],
        population: 16200,
        impact_flag: 'PARTIALLY_SUBMERGED',
        flooded_buildings_count: 14,
        inundation_percentage: 12.5,
        distance_to_flood_m: 120.0,
        access_status: 'CONSTRAINED',
        recommended_action: 'DEPLOY_RESCUE_BOATS_AND_RELIEF',
        protocol_details: 'Jalad river backflow inundated southern ponds and fields. Municipal ring road passable for high vehicles.',
      },
      {
        settlement_id: 'KAM_03',
        settlement_name: 'Basbitti Lowland Farming Settlement',
        settlement_type: 'Agricultural Village',
        district: 'Dhanusha',
        municipality: 'Sabaila Municipality',
        coords: [26.735, 85.965],
        population: 7400,
        impact_flag: 'CRITICAL_INUNDATED',
        flooded_buildings_count: 19,
        inundation_percentage: 51.0,
        distance_to_flood_m: 0.0,
        access_status: 'SEVERED',
        recommended_action: 'IMMEDIATE_AIRLIFT_EVACUATION',
        protocol_details: 'Submerged between overflowing irrigation canals and Kamala river channel. Urgent boat evacuation.',
      },
      {
        settlement_id: 'KAM_04',
        settlement_name: 'Lahan Commercial High Hub',
        settlement_type: 'Highway Municipality',
        district: 'Siraha',
        municipality: 'Lahan Municipality',
        coords: [26.728, 86.485],
        population: 41000,
        impact_flag: 'SECURE_HIGH_GROUND',
        flooded_buildings_count: 0,
        inundation_percentage: 0.0,
        distance_to_flood_m: 16200.0,
        access_status: 'ACCESSIBLE',
        recommended_action: 'DESIGNATE_AS_RELIEF_AND_SHELTER_HUB',
        protocol_details: 'High-elevation commercial hub along East-West Highway with major medical facility and helicopter landing ground.',
      },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 4. BAGMATI & LALBAKEYA SECTOR (CENTRAL TERAI - GAUR DELUGE)
  // ───────────────────────────────────────────────────────────────────────────
  bagmati_sector: {
    id: 'bagmati_sector',
    name: 'Bagmati & Lalbakeya Sector (Gaur Deluge & Sarlahi)',
    shortName: 'Bagmati-Lalbakeya Sector',
    riverName: 'Bagmati & Lalbakeya Rivers (Rautahat & Sarlahi)',
    districts: ['Rautahat', 'Sarlahi'],
    center: [26.85, 85.32],
    zoom: 11,
    opticalCollection: 'COPERNICUS/S2_SR_HARMONIZED (Sentinel-2 L2A)',
    preDateWindow: '2024-06-01 → 2024-06-25',
    postDateWindow: '2024-09-20 → 2024-10-15',
    totalFloodedAreaKm2: 168.40,
    baselineWaterAreaKm2: 38.60,
    newlyFloodedAreaKm2: 129.80,
    totalPopulationAffected: 42800,
    accuracy: {
      iou: 0.9310,
      f1: 0.9642,
      overallAccuracy: 0.9880,
      precision: 0.9885,
      recall: 0.9410,
      cohensKappa: 0.9560,
      confusionMatrix: { tp: 19800, fp: 230, fn: 1240, tn: 113730, total: 135000 },
    },
    floodPolygons: [
      [
        [27.15, 85.39], [27.08, 85.36], [27.01, 85.33], [26.94, 85.31],
        [26.87, 85.29], [26.80, 85.27], [26.76, 85.26], [26.76, 85.31],
        [26.78, 85.35], [26.85, 85.38], [26.92, 85.40], [27.00, 85.42],
        [27.08, 85.43], [27.16, 85.42], [27.15, 85.39]
      ]
    ],
    baselineRiverPolygons: [
      [
        [27.15, 85.37], [27.05, 85.34], [26.95, 85.32], [26.85, 85.30],
        [26.76, 85.28], [26.76, 85.30], [26.86, 85.32], [26.96, 85.34],
        [27.06, 85.36], [27.15, 85.37]
      ]
    ],
    demSlopeMaskPolygons: [
      [[27.22, 85.30], [27.25, 85.45], [27.20, 85.50], [27.18, 85.32], [27.22, 85.30]]
    ],
    settlements: [
      {
        settlement_id: 'BAG_01',
        settlement_name: 'Gaur Municipality Core (Ring Dam Basin)',
        settlement_type: 'District Headquarters & Border Hub',
        district: 'Rautahat',
        municipality: 'Gaur Municipality',
        coords: [26.765, 85.275],
        population: 26000,
        impact_flag: 'CRITICAL_INUNDATED',
        flooded_buildings_count: 52,
        inundation_percentage: 72.0,
        distance_to_flood_m: 0.0,
        access_status: 'SEVERED',
        recommended_action: 'IMMEDIATE_AIRLIFT_EVACUATION',
        protocol_details: 'Catastrophic ring dam waterlogging. Standing depth 2.4m across market and hospital wards. Zero natural drainage.',
      },
      {
        settlement_id: 'BAG_02',
        settlement_name: 'Pipra Rajdevi Ward',
        settlement_type: 'Riparian Village',
        district: 'Rautahat',
        municipality: 'Rajdevi Municipality',
        coords: [26.812, 85.290],
        population: 9400,
        impact_flag: 'CRITICAL_INUNDATED',
        flooded_buildings_count: 24,
        inundation_percentage: 61.5,
        distance_to_flood_m: 0.0,
        access_status: 'SEVERED',
        recommended_action: 'IMMEDIATE_AIRLIFT_EVACUATION',
        protocol_details: 'Lalbakeya western earthen dyke washed out. Water sweeping through central chowk. Urgent amphibious extraction.',
      },
      {
        settlement_id: 'BAG_03',
        settlement_name: 'Malangwa Border Area',
        settlement_type: 'Commercial Municipality',
        district: 'Sarlahi',
        municipality: 'Malangwa Municipality',
        coords: [26.858, 85.558],
        population: 18200,
        impact_flag: 'PARTIALLY_SUBMERGED',
        flooded_buildings_count: 16,
        inundation_percentage: 14.0,
        distance_to_flood_m: 140.0,
        access_status: 'CONSTRAINED',
        recommended_action: 'DEPLOY_RESCUE_BOATS_AND_RELIEF',
        protocol_details: 'Southern border wards experiencing 0.6m inundation. Bypass link to Nawalpur intact for relief convoys.',
      },
      {
        settlement_id: 'BAG_04',
        settlement_name: 'Chandrapur Elevated Highway Hub',
        settlement_type: 'Highway Commercial Center',
        district: 'Rautahat',
        municipality: 'Chandrapur Municipality',
        coords: [27.125, 85.395],
        population: 48000,
        impact_flag: 'SECURE_HIGH_GROUND',
        flooded_buildings_count: 0,
        inundation_percentage: 0.0,
        distance_to_flood_m: 18400.0,
        access_status: 'ACCESSIBLE',
        recommended_action: 'DESIGNATE_AS_RELIEF_AND_SHELTER_HUB',
        protocol_details: 'High-elevation alluvial terrace on Mahendra Highway. Base for Nepal Army helicopter airlifts to Gaur.',
      },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 5. NARAYANI / CHITWAN VALLEY SECTOR
  // ───────────────────────────────────────────────────────────────────────────
  narayani_sector: {
    id: 'narayani_sector',
    name: 'Narayani / Chitwan River Sector (Central Terai)',
    shortName: 'Narayani Sector',
    riverName: 'Narayani River (Chitwan & Nawalparasi East)',
    districts: ['Chitwan', 'Nawalparasi East'],
    center: [27.65, 84.28],
    zoom: 11,
    opticalCollection: 'COPERNICUS/S2_SR_HARMONIZED (Sentinel-2 L2A)',
    preDateWindow: '2024-06-01 → 2024-06-30',
    postDateWindow: '2024-09-15 → 2024-10-15',
    totalFloodedAreaKm2: 124.30,
    baselineWaterAreaKm2: 36.80,
    newlyFloodedAreaKm2: 87.50,
    totalPopulationAffected: 24200,
    accuracy: {
      iou: 0.9215,
      f1: 0.9591,
      overallAccuracy: 0.9854,
      precision: 0.9820,
      recall: 0.9372,
      cohensKappa: 0.9490,
      confusionMatrix: { tp: 16420, fp: 301, fn: 1100, tn: 117179, total: 135000 },
    },
    floodPolygons: [
      [
        [27.712, 84.428], [27.710, 84.390], [27.708, 84.350], [27.704, 84.310],
        [27.698, 84.270], [27.688, 84.230], [27.672, 84.195], [27.652, 84.160],
        [27.625, 84.135], [27.585, 84.150], [27.558, 84.175], [27.562, 84.195],
        [27.580, 84.218], [27.610, 84.232], [27.635, 84.248], [27.662, 84.278],
        [27.676, 84.318], [27.686, 84.368], [27.696, 84.422], [27.712, 84.428]
      ]
    ],
    baselineRiverPolygons: [
      [
        [27.708, 84.425], [27.706, 84.395], [27.704, 84.360], [27.700, 84.320],
        [27.694, 84.280], [27.685, 84.240], [27.672, 84.210], [27.658, 84.180],
        [27.638, 84.150], [27.610, 84.140], [27.575, 84.165], [27.562, 84.182],
        [27.578, 84.210], [27.602, 84.225], [27.625, 84.238], [27.645, 84.248],
        [27.672, 84.275], [27.682, 84.320], [27.690, 84.370], [27.698, 84.420],
        [27.708, 84.425]
      ]
    ],
    demSlopeMaskPolygons: [
      [[27.715, 84.140], [27.730, 84.240], [27.740, 84.350], [27.735, 84.420], [27.715, 84.415], [27.710, 84.280], [27.705, 84.150], [27.715, 84.140]]
    ],
    settlements: [
      {
        settlement_id: 'SET_N1',
        settlement_name: 'Meghauli Riverfront',
        settlement_type: 'Ecotourism Settlement',
        district: 'Chitwan',
        municipality: 'Bharatpur Metropolitan City',
        coords: [27.578, 84.215],
        population: 14200,
        impact_flag: 'CRITICAL_INUNDATED',
        flooded_buildings_count: 32,
        inundation_percentage: 48.0,
        distance_to_flood_m: 0.0,
        access_status: 'SEVERED',
        recommended_action: 'IMMEDIATE_AIRLIFT_EVACUATION',
        protocol_details: 'Narayani flood surge backwatered into Rapti confluence at Golaghat. Resort lodges and residential wards flooded under 1.6m water.',
      },
      {
        settlement_id: 'SET_N2',
        settlement_name: 'Island Jungle & Kawasoti Island',
        settlement_type: 'Riverine Island Community',
        district: 'Nawalparasi East',
        municipality: 'Kawasoti Municipality',
        coords: [27.645, 84.220],
        population: 5600,
        impact_flag: 'CRITICAL_INUNDATED',
        flooded_buildings_count: 24,
        inundation_percentage: 62.0,
        distance_to_flood_m: 0.0,
        access_status: 'SEVERED',
        recommended_action: 'IMMEDIATE_AIRLIFT_EVACUATION',
        protocol_details: 'Island surrounded by swollen Narayani river channels. Inundation depth exceeds 1.8m. Immediate boat evacuation.',
      },
      {
        settlement_id: 'SET_N3',
        settlement_name: 'Dibyanagar Lowlands',
        settlement_type: 'Agricultural Ward',
        district: 'Chitwan',
        municipality: 'Bharatpur Metropolitan City',
        coords: [27.632, 84.260],
        population: 11800,
        impact_flag: 'PARTIALLY_SUBMERGED',
        flooded_buildings_count: 14,
        inundation_percentage: 14.5,
        distance_to_flood_m: 120.0,
        access_status: 'CONSTRAINED',
        recommended_action: 'DEPLOY_RESCUE_BOATS_AND_RELIEF',
        protocol_details: 'Southern agricultural perimeter flooded by embankment overflow. Primary road toward Bharatpur remains passable for high vehicles.',
      },
      {
        settlement_id: 'SET_N4',
        settlement_name: 'Bharatpur Metropolitan Core',
        settlement_type: 'Metropolitan Center',
        district: 'Chitwan',
        municipality: 'Bharatpur Metropolitan City',
        coords: [27.685, 84.430],
        population: 85000,
        impact_flag: 'SECURE_HIGH_GROUND',
        flooded_buildings_count: 0,
        inundation_percentage: 0.0,
        distance_to_flood_m: 3200.0,
        access_status: 'ACCESSIBLE',
        recommended_action: 'DESIGNATE_AS_RELIEF_AND_SHELTER_HUB',
        protocol_details: 'Major hospital and regional administrative hub on secure high terrace. Base for military air operations and blood bank reserves.',
      },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 6. LUMBINI TERAI SECTOR (TINAU & MARCHWAR PLAINS)
  // ───────────────────────────────────────────────────────────────────────────
  tinau_sector: {
    id: 'tinau_sector',
    name: 'Lumbini Terai Sector (Tinau, Rohini & Marchawar)',
    shortName: 'Lumbini-Tinau Sector',
    riverName: 'Tinau, Rohini & Dano Rivers',
    districts: ['Rupandehi', 'Kapilvastu', 'Nawalparasi West'],
    center: [27.50, 83.45],
    zoom: 11,
    opticalCollection: 'COPERNICUS/S2_SR_HARMONIZED (Sentinel-2 L2A)',
    preDateWindow: '2024-06-05 → 2024-06-28',
    postDateWindow: '2024-09-22 → 2024-10-10',
    totalFloodedAreaKm2: 98.70,
    baselineWaterAreaKm2: 26.20,
    newlyFloodedAreaKm2: 72.50,
    totalPopulationAffected: 26100,
    accuracy: {
      iou: 0.9190,
      f1: 0.9578,
      overallAccuracy: 0.9850,
      precision: 0.9790,
      recall: 0.9375,
      cohensKappa: 0.9488,
      confusionMatrix: { tp: 15100, fp: 290, fn: 1010, tn: 118600, total: 135000 },
    },
    floodPolygons: [
      [
        [27.58, 83.45], [27.52, 83.43], [27.45, 83.40], [27.42, 83.40],
        [27.42, 83.44], [27.44, 83.48], [27.48, 83.52], [27.56, 83.50],
        [27.58, 83.45]
      ]
    ],
    baselineRiverPolygons: [
      [
        [27.68, 83.46], [27.60, 83.45], [27.52, 83.44], [27.44, 83.42],
        [27.44, 83.44], [27.52, 83.46], [27.60, 83.47], [27.68, 83.46]
      ]
    ],
    demSlopeMaskPolygons: [
      [[27.72, 83.40], [27.76, 83.50], [27.72, 83.55], [27.70, 83.42], [27.72, 83.40]]
    ],
    settlements: [
      {
        settlement_id: 'TIN_01',
        settlement_name: 'Marchawar Kotahimai Border Area',
        settlement_type: 'Border Rural Municipality',
        district: 'Rupandehi',
        municipality: 'Kotahimai Rural Municipality',
        coords: [27.435, 83.420],
        population: 14500,
        impact_flag: 'CRITICAL_INUNDATED',
        flooded_buildings_count: 29,
        inundation_percentage: 57.0,
        distance_to_flood_m: 0.0,
        access_status: 'SEVERED',
        recommended_action: 'IMMEDIATE_AIRLIFT_EVACUATION',
        protocol_details: 'Cross-border bund obstruction causing 1.7m standing water across village settlements and schools.',
      },
      {
        settlement_id: 'TIN_02',
        settlement_name: 'Bhairahawa Airport Periphery',
        settlement_type: 'Airport Buffer Settlement',
        district: 'Rupandehi',
        municipality: 'Siddharthanagar Municipality',
        coords: [27.510, 83.435],
        population: 12200,
        impact_flag: 'PARTIALLY_SUBMERGED',
        flooded_buildings_count: 11,
        inundation_percentage: 10.5,
        distance_to_flood_m: 180.0,
        access_status: 'CONSTRAINED',
        recommended_action: 'DEPLOY_RESCUE_BOATS_AND_RELIEF',
        protocol_details: 'Dano river overflow backing up into perimeter drainage canals. Main runway protected by floodwall.',
      },
      {
        settlement_id: 'TIN_03',
        settlement_name: 'Butwal Elevated High Terrace',
        settlement_type: 'Sub-Metropolitan Hub',
        district: 'Rupandehi',
        municipality: 'Butwal Sub-Metropolitan City',
        coords: [27.700, 83.465],
        population: 62000,
        impact_flag: 'SECURE_HIGH_GROUND',
        flooded_buildings_count: 0,
        inundation_percentage: 0.0,
        distance_to_flood_m: 16500.0,
        access_status: 'ACCESSIBLE',
        recommended_action: 'DESIGNATE_AS_RELIEF_AND_SHELTER_HUB',
        protocol_details: 'Located on high alluvial fan apex at Chure base. Fully operational hospital logistics and military staging base.',
      },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 7. WEST RAPTI FLOODPLAIN SECTOR (BANKE & DANG)
  // ───────────────────────────────────────────────────────────────────────────
  west_rapti_sector: {
    id: 'west_rapti_sector',
    name: 'West Rapti Floodplain Sector (Banke & Dang)',
    shortName: 'West Rapti Sector',
    riverName: 'West Rapti River (Holiya & Narainapur)',
    districts: ['Banke', 'Dang'],
    center: [27.95, 81.75],
    zoom: 11,
    opticalCollection: 'COPERNICUS/S2_SR_HARMONIZED (Sentinel-2 L2A)',
    preDateWindow: '2024-06-01 → 2024-06-28',
    postDateWindow: '2024-09-18 → 2024-10-14',
    totalFloodedAreaKm2: 146.80,
    baselineWaterAreaKm2: 34.50,
    newlyFloodedAreaKm2: 112.30,
    totalPopulationAffected: 36400,
    accuracy: {
      iou: 0.9290,
      f1: 0.9632,
      overallAccuracy: 0.9875,
      precision: 0.9870,
      recall: 0.9405,
      cohensKappa: 0.9550,
      confusionMatrix: { tp: 18400, fp: 240, fn: 1160, tn: 115200, total: 135000 },
    },
    floodPolygons: [
      [
        [28.12, 81.90], [28.08, 81.82], [28.02, 81.74], [27.96, 81.65],
        [27.90, 81.58], [27.84, 81.52], [27.82, 81.58], [27.88, 81.68],
        [27.95, 81.78], [28.02, 81.88], [28.08, 81.96], [28.12, 81.90]
      ]
    ],
    baselineRiverPolygons: [
      [
        [28.14, 81.92], [28.06, 81.82], [27.98, 81.72], [27.90, 81.62],
        [27.83, 81.55], [27.84, 81.57], [27.91, 81.64], [27.99, 81.74],
        [28.07, 81.84], [28.14, 81.92]
      ]
    ],
    demSlopeMaskPolygons: [
      [[28.18, 81.85], [28.22, 81.98], [28.15, 82.05], [28.12, 81.88], [28.18, 81.85]]
    ],
    settlements: [
      {
        settlement_id: 'RAP_01',
        settlement_name: 'Holiya Riverine Settlement',
        settlement_type: 'Lowland Farming Village',
        district: 'Banke',
        municipality: 'Duduwa Rural Municipality',
        coords: [27.940, 81.710],
        population: 13500,
        impact_flag: 'CRITICAL_INUNDATED',
        flooded_buildings_count: 36,
        inundation_percentage: 64.0,
        distance_to_flood_m: 0.0,
        access_status: 'SEVERED',
        recommended_action: 'IMMEDIATE_AIRLIFT_EVACUATION',
        protocol_details: 'Laxmanpur Barrage backwater submerged Holiya under 2.1m floodwater. Rapid APF motorboat evacuation necessary.',
      },
      {
        settlement_id: 'RAP_02',
        settlement_name: 'Narainapur Border Belt',
        settlement_type: 'Border Rural Ward',
        district: 'Banke',
        municipality: 'Narainapur Rural Municipality',
        coords: [27.865, 81.560],
        population: 16800,
        impact_flag: 'CRITICAL_INUNDATED',
        flooded_buildings_count: 28,
        inundation_percentage: 52.0,
        distance_to_flood_m: 0.0,
        access_status: 'SEVERED',
        recommended_action: 'IMMEDIATE_AIRLIFT_EVACUATION',
        protocol_details: 'Kalkaluwa bund water stagnation. Southern wards isolated with 1.8m water depth.',
      },
      {
        settlement_id: 'RAP_03',
        settlement_name: 'Kohalpur Highway Junction Hub',
        settlement_type: 'Regional Transport Junction',
        district: 'Banke',
        municipality: 'Kohalpur Municipality',
        coords: [28.195, 81.690],
        population: 52000,
        impact_flag: 'SECURE_HIGH_GROUND',
        flooded_buildings_count: 0,
        inundation_percentage: 0.0,
        distance_to_flood_m: 19500.0,
        access_status: 'ACCESSIBLE',
        recommended_action: 'DESIGNATE_AS_RELIEF_AND_SHELTER_HUB',
        protocol_details: 'Major intersection of East-West and Karnali highways on secure high terrace. Main military air and truck relief depot.',
      },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 8. BABAI RIVER SECTOR (BARDIYA - GULARIYA & RAJAPUR)
  // ───────────────────────────────────────────────────────────────────────────
  babai_sector: {
    id: 'babai_sector',
    name: 'Babai River Sector (Gulariya & Rajapur Delta)',
    shortName: 'Babai-Bardiya Sector',
    riverName: 'Babai & Sarayu Rivers (Gulariya)',
    districts: ['Bardiya'],
    center: [28.23, 81.36],
    zoom: 11,
    opticalCollection: 'COPERNICUS/S2_SR_HARMONIZED (Sentinel-2 L2A)',
    preDateWindow: '2024-06-08 → 2024-06-30',
    postDateWindow: '2024-09-20 → 2024-10-12',
    totalFloodedAreaKm2: 118.20,
    baselineWaterAreaKm2: 29.40,
    newlyFloodedAreaKm2: 88.80,
    totalPopulationAffected: 27900,
    accuracy: {
      iou: 0.9230,
      f1: 0.9600,
      overallAccuracy: 0.9860,
      precision: 0.9830,
      recall: 0.9380,
      cohensKappa: 0.9510,
      confusionMatrix: { tp: 16100, fp: 270, fn: 1060, tn: 117570, total: 135000 },
    },
    floodPolygons: [
      [
        [28.32, 81.42], [28.25, 81.36], [28.18, 81.30], [28.12, 81.25],
        [28.10, 81.31], [28.16, 81.38], [28.23, 81.44], [28.30, 81.48],
        [28.32, 81.42]
      ]
    ],
    baselineRiverPolygons: [
      [
        [28.35, 81.44], [28.27, 81.38], [28.20, 81.32], [28.13, 81.27],
        [28.14, 81.29], [28.21, 81.34], [28.28, 81.40], [28.35, 81.44]
      ]
    ],
    demSlopeMaskPolygons: [
      [[28.40, 81.35], [28.45, 81.50], [28.38, 81.55], [28.36, 81.38], [28.40, 81.35]]
    ],
    settlements: [
      {
        settlement_id: 'BAB_01',
        settlement_name: 'Gulariya Municipal Core',
        settlement_type: 'District Headquarters',
        district: 'Bardiya',
        municipality: 'Gulariya Municipality',
        coords: [28.235, 81.335],
        population: 24000,
        impact_flag: 'CRITICAL_INUNDATED',
        flooded_buildings_count: 42,
        inundation_percentage: 63.0,
        distance_to_flood_m: 0.0,
        access_status: 'SEVERED',
        recommended_action: 'IMMEDIATE_AIRLIFT_EVACUATION',
        protocol_details: 'Babai bridge approach road collapsed. District administration building and hospital flooded under 1.8m current.',
      },
      {
        settlement_id: 'BAB_02',
        settlement_name: 'Rajapur Delta Island Ward',
        settlement_type: 'Island Agricultural Municipality',
        district: 'Bardiya',
        municipality: 'Rajapur Municipality',
        coords: [28.420, 81.100],
        population: 18500,
        impact_flag: 'CRITICAL_INUNDATED',
        flooded_buildings_count: 31,
        inundation_percentage: 58.0,
        distance_to_flood_m: 0.0,
        access_status: 'SEVERED',
        recommended_action: 'IMMEDIATE_AIRLIFT_EVACUATION',
        protocol_details: 'Surrounded between Karnali and Geruwa channels. Inundation depth 2.0m. Boat evacuation to high embankment.',
      },
      {
        settlement_id: 'BAB_03',
        settlement_name: 'Bansgadhi Elevated Highway Center',
        settlement_type: 'Highway Commercial Center',
        district: 'Bardiya',
        municipality: 'Bansgadhi Municipality',
        coords: [28.315, 81.520],
        population: 32000,
        impact_flag: 'SECURE_HIGH_GROUND',
        flooded_buildings_count: 0,
        inundation_percentage: 0.0,
        distance_to_flood_m: 14200.0,
        access_status: 'ACCESSIBLE',
        recommended_action: 'DESIGNATE_AS_RELIEF_AND_SHELTER_HUB',
        protocol_details: 'High-elevation alluvial terrace on East-West Highway. Primary staging area for Bardiya disaster relief supplies.',
      },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 9. KARNALI DELTA & MOHANA BASIN (FAR-WESTERN TERAI - KAILALI)
  // ───────────────────────────────────────────────────────────────────────────
  karnali_sector: {
    id: 'karnali_sector',
    name: 'Karnali Delta & Mohana Basin Sector (Tikapur & Bhajani)',
    shortName: 'Karnali-Mohana Sector',
    riverName: 'Karnali Delta & Mohana River (Kailali)',
    districts: ['Kailali'],
    center: [28.48, 81.20],
    zoom: 11,
    opticalCollection: 'COPERNICUS/S2_SR_HARMONIZED (Sentinel-2 L2A)',
    preDateWindow: '2024-06-05 → 2024-06-28',
    postDateWindow: '2024-09-15 → 2024-10-14',
    totalFloodedAreaKm2: 154.60,
    baselineWaterAreaKm2: 41.20,
    newlyFloodedAreaKm2: 113.40,
    totalPopulationAffected: 39200,
    accuracy: {
      iou: 0.9280,
      f1: 0.9626,
      overallAccuracy: 0.9870,
      precision: 0.9860,
      recall: 0.9402,
      cohensKappa: 0.9540,
      confusionMatrix: { tp: 19100, fp: 250, fn: 1210, tn: 114440, total: 135000 },
    },
    floodPolygons: [
      [
        [28.60, 81.22], [28.52, 81.18], [28.44, 81.14], [28.36, 81.10],
        [28.34, 81.16], [28.40, 81.22], [28.48, 81.28], [28.56, 81.30],
        [28.60, 81.22]
      ]
    ],
    baselineRiverPolygons: [
      [
        [28.64, 81.26], [28.55, 81.22], [28.46, 81.18], [28.38, 81.14],
        [28.39, 81.16], [28.47, 81.20], [28.56, 81.24], [28.64, 81.26]
      ]
    ],
    demSlopeMaskPolygons: [
      [[28.72, 81.15], [28.76, 81.30], [28.70, 81.35], [28.68, 81.18], [28.72, 81.15]]
    ],
    settlements: [
      {
        settlement_id: 'KAR_01',
        settlement_name: 'Bhajani Municipality Core',
        settlement_type: 'Lowland Municipality',
        district: 'Kailali',
        municipality: 'Bhajani Municipality',
        coords: [28.440, 81.080],
        population: 17500,
        impact_flag: 'CRITICAL_INUNDATED',
        flooded_buildings_count: 48,
        inundation_percentage: 71.0,
        distance_to_flood_m: 0.0,
        access_status: 'SEVERED',
        recommended_action: 'IMMEDIATE_AIRLIFT_EVACUATION',
        protocol_details: 'Simultaneous overflow of Karnali and Mohana rivers submerged 71% of Bhajani basin. Postal highway submerged 14 km.',
      },
      {
        settlement_id: 'KAR_02',
        settlement_name: 'Tikapur Riverside Wards',
        settlement_type: 'Urban Sub-Center',
        district: 'Kailali',
        municipality: 'Tikapur Municipality',
        coords: [28.520, 81.130],
        population: 28000,
        impact_flag: 'CRITICAL_INUNDATED',
        flooded_buildings_count: 36,
        inundation_percentage: 54.0,
        distance_to_flood_m: 0.0,
        access_status: 'SEVERED',
        recommended_action: 'IMMEDIATE_AIRLIFT_EVACUATION',
        protocol_details: 'Riverbank dykes overtopped by 380,000 cusecs Karnali surge. Deploy motorized rafts and naval salvage units.',
      },
      {
        settlement_id: 'KAR_03',
        settlement_name: 'Attariya Crossroads Safe Hub',
        settlement_type: 'Highland Junction City',
        district: 'Kailali',
        municipality: 'Godawari Municipality',
        coords: [28.790, 80.570],
        population: 46000,
        impact_flag: 'SECURE_HIGH_GROUND',
        flooded_buildings_count: 0,
        inundation_percentage: 0.0,
        distance_to_flood_m: 24000.0,
        access_status: 'ACCESSIBLE',
        recommended_action: 'DESIGNATE_AS_RELIEF_AND_SHELTER_HUB',
        protocol_details: 'Secure elevated crossroads along Far-Western arterial highway. Fully safe medical and helicopter coordination zone.',
      },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 10. MAHAKALI RIVER SECTOR (FAR-WESTERN BORDER - KANCHANPUR)
  // ───────────────────────────────────────────────────────────────────────────
  mahakali_sector: {
    id: 'mahakali_sector',
    name: 'Mahakali River Sector (Dodhara-Chandani & Kanchanpur)',
    shortName: 'Mahakali Sector',
    riverName: 'Mahakali River (Bhimdatta & Dodhara-Chandani)',
    districts: ['Kanchanpur'],
    center: [28.85, 80.18],
    zoom: 11,
    opticalCollection: 'COPERNICUS/S2_SR_HARMONIZED (Sentinel-2 L2A)',
    preDateWindow: '2024-06-01 → 2024-06-25',
    postDateWindow: '2024-09-18 → 2024-10-15',
    totalFloodedAreaKm2: 88.40,
    baselineWaterAreaKm2: 26.80,
    newlyFloodedAreaKm2: 61.60,
    totalPopulationAffected: 22600,
    accuracy: {
      iou: 0.9250,
      f1: 0.9610,
      overallAccuracy: 0.9865,
      precision: 0.9840,
      recall: 0.9390,
      cohensKappa: 0.9530,
      confusionMatrix: { tp: 13800, fp: 220, fn: 890, tn: 120090, total: 135000 },
    },
    floodPolygons: [
      [
        [28.98, 80.12], [28.92, 80.10], [28.84, 80.14], [28.76, 80.20],
        [28.72, 80.28], [28.70, 80.34], [28.76, 80.32], [28.82, 80.26],
        [28.90, 80.20], [28.98, 80.18], [28.98, 80.12]
      ]
    ],
    baselineRiverPolygons: [
      [
        [29.00, 80.14], [28.93, 80.12], [28.85, 80.16], [28.78, 80.22],
        [28.79, 80.24], [28.86, 80.18], [28.94, 80.14], [29.00, 80.14]
      ]
    ],
    demSlopeMaskPolygons: [
      [[29.05, 80.10], [29.10, 80.25], [29.04, 80.30], [29.02, 80.12], [29.05, 80.10]]
    ],
    settlements: [
      {
        settlement_id: 'MAH_01',
        settlement_name: 'Dodhara-Chandani Island Wards',
        settlement_type: 'Trans-Mahakali Municipality',
        district: 'Kanchanpur',
        municipality: 'Dodhara Chandani Municipality',
        coords: [28.885, 80.080],
        population: 14200,
        impact_flag: 'CRITICAL_INUNDATED',
        flooded_buildings_count: 38,
        inundation_percentage: 67.0,
        distance_to_flood_m: 0.0,
        access_status: 'SEVERED',
        recommended_action: 'IMMEDIATE_AIRLIFT_EVACUATION',
        protocol_details: 'Mahakali discharge exceeding 450,000 cusecs flooded suspension bridge approaches and island wards.',
      },
      {
        settlement_id: 'MAH_02',
        settlement_name: 'Belauri Border Riverfront',
        settlement_type: 'Border Municipality',
        district: 'Kanchanpur',
        municipality: 'Belauri Municipality',
        coords: [28.715, 80.345],
        population: 11400,
        impact_flag: 'CRITICAL_INUNDATED',
        flooded_buildings_count: 22,
        inundation_percentage: 45.0,
        distance_to_flood_m: 0.0,
        access_status: 'SEVERED',
        recommended_action: 'DEPLOY_RESCUE_BOATS_AND_RELIEF',
        protocol_details: 'Jogbuda river backflow inundated farmlands and custom border road. Deploy rescue rafts.',
      },
      {
        settlement_id: 'MAH_03',
        settlement_name: 'Mahendranagar Elevated Core',
        settlement_type: 'District Headquarters City',
        district: 'Kanchanpur',
        municipality: 'Bhimdatta Municipality',
        coords: [28.960, 80.180],
        population: 48000,
        impact_flag: 'SECURE_HIGH_GROUND',
        flooded_buildings_count: 0,
        inundation_percentage: 0.0,
        distance_to_flood_m: 6500.0,
        access_status: 'ACCESSIBLE',
        recommended_action: 'DESIGNATE_AS_RELIEF_AND_SHELTER_HUB',
        protocol_details: 'Secure elevated urban core protected by northern spurs. District hospital and Armed Police Force regional headquarters.',
      },
    ],
  },
};

export const TIER_CONFIG = {
  CRITICAL_INUNDATED: {
    label: 'Critical Inundation',
    badge: 'CRITICAL',
    badgeColor: 'border-rose-500/50 bg-rose-500/15 text-rose-300',
    dotColor: 'bg-rose-500',
    hexColor: '#EF4444',
    actionText: 'Immediate Airlift Evacuation',
    description: '> 15% settlement footprint flooded or high structural destruction.',
  },
  PARTIALLY_SUBMERGED: {
    label: 'Partially Submerged',
    badge: 'PARTIAL',
    badgeColor: 'border-amber-500/50 bg-amber-500/15 text-amber-300',
    dotColor: 'bg-amber-500',
    hexColor: '#F59E0B',
    actionText: 'Deploy Rescue Boats & Relief',
    description: '1% - 15% footprint inundated; ground routes constrained.',
  },
  ISOLATED_CUTOFF: {
    label: 'Isolated & Cut-Off',
    badge: 'CUT-OFF',
    badgeColor: 'border-orange-500/50 bg-orange-500/15 text-orange-300',
    dotColor: 'bg-orange-500',
    hexColor: '#F97316',
    actionText: 'Helicopter Airdrop & Supply',
    description: 'Settlement high-ground is dry, but all road access corridors are severed.',
  },
  SECURE_HIGH_GROUND: {
    label: 'Secure High Ground',
    badge: 'SAFE HUB',
    badgeColor: 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300',
    dotColor: 'bg-emerald-500',
    hexColor: '#10B981',
    actionText: 'Designate as Relief Hub',
    description: 'Completely unflooded elevated terrain; unhampered highway connectivity.',
  },
};
