/**
 * teraiRoadNetwork.ts — Comprehensive Road Inundation & Disruption Intelligence for Nepal Terai.
 *
 * Stage 5.4 Deliverable (Point 4):
 * 1. Primary Terai Highway Network: Mahendra Highway (H01), Postal Highway (Hulaki Rajmarg / H12), and Feeder Links.
 * 2. Real-Time Inundation Segmentation: Impassable (Submerged >0.5m), Restricted (High-Clearance), Open (Passable).
 * 3. Critical River Crossing & Barrage Vulnerability Monitor (Koshi, Bagmati, Narayani, Karnali, Lalbakeya).
 * 4. High-Impact Isolation Communities (cut-off settlements with zero road transit).
 */

export interface RoadSegment {
  id: string;
  highwayCode: 'H01' | 'H12' | 'F01' | 'F02' | 'F03' | 'F04' | 'F05' | 'F06';
  name: string;
  nepaliName: string;
  corridor: string;
  district: string;
  status: 'submerged' | 'restricted' | 'open';
  lengthKm: number;
  submergedLengthKm: number;
  maxWaterDepthMeters: number;
  color: string;
  breachCause?: string;
  clearanceAdvice: string;
  bypassRecommendation?: string;
  path: [number, number][]; // [lat, lng][]
}

export interface TeraiBridge {
  id: string;
  name: string;
  nepaliName: string;
  river: string;
  district: string;
  coords: [number, number]; // [lat, lng]
  status: 'critical_danger' | 'high_warning' | 'monitored_safe';
  trafficStatus: 'closed' | 'restricted_single_lane' | 'open_normal';
  dischargeCusecs?: number;
  waterLevelMeters?: number;
  dangerLevelMeters?: number;
  structuralStatus: string;
  notes: string;
}

export interface IsolatedCommunity {
  id: string;
  name: string;
  nepaliName: string;
  district: string;
  coords: [number, number];
  populationCutOff: number;
  estimatedIsolationDays: number;
  submergedAccessRoad: string;
  emergencyAccessMethod: 'boat_and_helicopter' | 'heavy_tractor_only' | 'high_clearance_convoy';
  nearestDepot: string;
  urgency: 'critical' | 'high' | 'moderate';
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. TERAI ROAD NETWORK SEGMENTS
// ─────────────────────────────────────────────────────────────────────────────
export const TERAI_ROAD_SEGMENTS: RoadSegment[] = [
  // ── MAHENDRA HIGHWAY (H01 / EAST-WEST HIGHWAY) ──────────────────────────────
  {
    id: 'road_h01_koshi_barrage',
    highwayCode: 'H01',
    name: 'Mahendra Highway: Bhantabari → Koshi Barrage → Kanchanpur (Saptari)',
    nepaliName: 'महेन्द्र राजमार्ग: भन्टाबारी → कोशी ब्यारेज → कञ्चनपुर (सप्तरी)',
    corridor: 'Koshi Basin Corridor',
    district: 'Sunsari / Saptari',
    status: 'restricted',
    lengthKm: 28.6,
    submergedLengthKm: 4.2,
    maxWaterDepthMeters: 0.45,
    color: '#F59E0B', // Amber
    breachCause: 'Saptakoshi river western embankment overflow near Laukahi km 412.',
    clearanceAdvice: 'Restricted transit. Heavy commercial trucks and Army 6x6 permitted. Small cars and motorcycles diverted.',
    bypassRecommendation: 'Take Inaruwa-Chatara bypass road to cross via Chatara suspension bridge.',
    path: [
      [26.65, 87.12],
      [26.61, 87.05],
      [26.56, 86.97],
      [26.52, 86.92], // Koshi Barrage sluices
      [26.55, 86.85],
      [26.60, 86.78],
    ],
  },
  {
    id: 'road_h01_bagmati_karmaiya',
    highwayCode: 'H01',
    name: 'Mahendra Highway: Karmaiya → Bagmati Bridge → Chandranigahapur',
    nepaliName: 'महेन्द्र राजमार्ग: कर्मैया → बागमती पुल → चन्द्रनिगाहपुर',
    corridor: 'Bagmati Basin Corridor',
    district: 'Sarlahi / Rautahat',
    status: 'open',
    lengthKm: 34.2,
    submergedLengthKm: 0.0,
    maxWaterDepthMeters: 0.0,
    color: '#10B981', // Green
    breachCause: 'No water on tarmac. Bridge approaches inspected and protected by gabion spurs.',
    clearanceAdvice: 'Open to all normal vehicular traffic. Maintain 40 km/h over Bagmati Bridge.',
    path: [
      [27.08, 85.52],
      [27.09, 85.45],
      [27.11, 85.38], // Karmaiya Bagmati Bridge
      [27.12, 85.31],
      [27.13, 85.24], // Chandranigahapur junction
    ],
  },
  {
    id: 'road_h01_narayangarh_butwal',
    highwayCode: 'H01',
    name: 'Mahendra Highway: Narayangarh → Daunne Hills → Butwal',
    nepaliName: 'महेन्द्र राजमार्ग: नारायणगढ → दाउन्ने → बुटवल',
    corridor: 'Narayani / Gandaki Corridor',
    district: 'Chitwan / Nawalpur / Rupandehi',
    status: 'open',
    lengthKm: 114.0,
    submergedLengthKm: 0.0,
    maxWaterDepthMeters: 0.0,
    color: '#10B981', // Green
    breachCause: 'Pavement dry. Single-lane slow transit at Daunne hill section due to landslide mud debris.',
    clearanceAdvice: 'Passable for all traffic. Heavy trucks must maintain 20m following distance.',
    path: [
      [27.70, 84.42],
      [27.65, 84.28],
      [27.60, 84.10],
      [27.56, 83.88], // Daunne
      [27.62, 83.65],
      [27.70, 83.46], // Butwal
    ],
  },
  {
    id: 'road_h01_nepalgunj_kohalpur',
    highwayCode: 'H01',
    name: 'Mahendra Highway: Kohalpur Hub → Kusum (West Rapti Bridge)',
    nepaliName: 'महेन्द्र राजमार्ग: कोहलपुर → कुसुम (राप्ती पुल)',
    corridor: 'West Rapti Corridor',
    district: 'Banke / Dang',
    status: 'restricted',
    lengthKm: 52.8,
    submergedLengthKm: 3.8,
    maxWaterDepthMeters: 0.35,
    color: '#F59E0B', // Amber
    breachCause: 'West Rapti flash surge overflowing near Agaiya barrage diversion intake.',
    clearanceAdvice: 'High-clearance vehicles only. Light vehicles should stage at Kohalpur bus terminal.',
    path: [
      [28.19, 81.69], // Kohalpur
      [28.14, 81.82],
      [28.08, 81.98], // Agaiya
      [28.01, 82.12], // Kusum
    ],
  },

  // ── POSTAL HIGHWAY (H12 / HULAKI RAJMARG) — HIGHLY INUNDATED SOUTHERN ARTERY ─
  {
    id: 'road_h12_gaur_kalaiya',
    highwayCode: 'H12',
    name: 'Postal Highway (Hulaki): Gaur Customs → Bairgania Border → Kalaiya',
    nepaliName: 'हुलाकी राजमार्ग: गौर भन्सार → बैरगनिया सीमा → कलैया',
    corridor: 'Lalbakeya & Bagmati Delta',
    district: 'Rautahat / Bara',
    status: 'submerged',
    lengthKm: 46.5,
    submergedLengthKm: 21.8,
    maxWaterDepthMeters: 2.2,
    color: '#EF4444', // Red
    breachCause: 'Lalbakeya River embankment completely breached at Banjaraha & Tikulia. Raging current over tarmac.',
    clearanceAdvice: 'CRITICAL: ROAD IMPASSABLE FOR ALL WHEELED VEHICLES. Only Nepal Army Zodiac motorboats operating.',
    bypassRecommendation: 'Evacuate north via Chandranigahapur feeder road to Mahendra Highway.',
    path: [
      [26.76, 85.28], // Gaur Border
      [26.79, 85.20],
      [26.84, 85.12],
      [26.90, 85.05],
      [26.98, 84.98], // Kalaiya
    ],
  },
  {
    id: 'road_h12_rangeli_kaptanganj',
    highwayCode: 'H12',
    name: 'Postal Highway (Hulaki): Rangeli → Kaptanganj → Inaruwa South',
    nepaliName: 'हुलाकी राजमार्ग: रङ्गेली → कप्तानगञ्ज → इनरुवा दक्षिण',
    corridor: 'Bakraha & Kesaliya Plains',
    district: 'Morang / Sunsari',
    status: 'submerged',
    lengthKm: 38.0,
    submergedLengthKm: 14.5,
    maxWaterDepthMeters: 1.6,
    color: '#EF4444', // Red
    breachCause: 'Bakraha River burst dykes flooding 14.5 km of rural Postal Highway.',
    clearanceAdvice: 'CLOSED: Water depth 1.6m with submerged culvert failure.',
    bypassRecommendation: 'Divert North to Biratnagar-Itahari commercial bypass.',
    path: [
      [26.47, 87.48], // Rangeli
      [26.44, 87.35],
      [26.48, 87.20],
      [26.54, 87.10], // Kaptanganj
    ],
  },
  {
    id: 'road_h12_bhajani_tikapur',
    highwayCode: 'H12',
    name: 'Postal Highway (Hulaki): Tikapur → Bhajani → Hasuliya',
    nepaliName: 'हुलाकी राजमार्ग: टीकापुर → भजनी → हसुलिया',
    corridor: 'Kandra & Mohana River Basin',
    district: 'Kailali',
    status: 'submerged',
    lengthKm: 42.0,
    submergedLengthKm: 18.2,
    maxWaterDepthMeters: 1.9,
    color: '#EF4444', // Red
    breachCause: 'Kandra and Patharaiya river flood confluence inundated entire highway section between Bhajani ward 3 and Lalbojhi.',
    clearanceAdvice: 'IMPASSABLE: Fast-flowing flood water across road. Risk of wash-out.',
    bypassRecommendation: 'Use Tikapur-Lamki link road to join Mahendra Highway at Lamki.',
    path: [
      [28.52, 81.13], // Tikapur
      [28.55, 81.04],
      [28.58, 80.95], // Bhajani
      [28.62, 80.82], // Hasuliya
    ],
  },
  {
    id: 'road_h12_banke_holiya',
    highwayCode: 'H12',
    name: 'Postal Highway (Hulaki): Nepalgunj Border → Kamdi → Holiya',
    nepaliName: 'हुलाकी राजमार्ग: नेपालगञ्ज सीमा → कम्दी → होलिया',
    corridor: 'Lower Rapti Inundation Plain',
    district: 'Banke',
    status: 'submerged',
    lengthKm: 32.4,
    submergedLengthKm: 11.2,
    maxWaterDepthMeters: 1.7,
    color: '#EF4444', // Red
    breachCause: 'Laxmanpur Barrage backflow and West Rapti overflow submerging southern embankment.',
    clearanceAdvice: 'ROAD CUT OFF: Armed Police Force inflatable rafts deployed for food delivery.',
    bypassRecommendation: 'Take Nepalgunj-Kohalpur 4-lane highway north.',
    path: [
      [28.04, 81.62], // Nepalgunj South
      [28.02, 81.70],
      [28.00, 81.78],
      [27.98, 81.88], // Holiya
    ],
  },

  // ── NORTH-SOUTH CRITICAL FEEDER ARTERIALS ──────────────────────────────────
  {
    id: 'road_f01_gaur_chandranigahapur',
    highwayCode: 'F01',
    name: 'Feeder Road: Chandranigahapur (H01) → Pipra → Gaur Headquarters',
    nepaliName: 'सहायक मार्ग: चन्द्रनिगाहपुर (महेन्द्र राजमार्ग) → पिपरा → गौर',
    corridor: 'Rautahat Central Lifeline',
    district: 'Rautahat',
    status: 'restricted',
    lengthKm: 42.0,
    submergedLengthKm: 5.6,
    maxWaterDepthMeters: 0.4,
    color: '#F59E0B', // Amber
    breachCause: 'Canal overflow at Pipra Bazar. Water depth 40cm on 5.6 km stretch.',
    clearanceAdvice: 'Army 6x6 relief convoys and high-clearance tractors allowed with APF escort.',
    bypassRecommendation: 'North half completely dry. Relief staging post operating at Pipra high school.',
    path: [
      [27.13, 85.24], // Chandranigahapur
      [27.05, 85.25],
      [26.98, 85.26], // Pipra
      [26.88, 85.27],
      [26.78, 85.28], // Gaur north approach
    ],
  },
  {
    id: 'road_f02_birgunj_pathlaiya',
    highwayCode: 'F02',
    name: 'Tribhuvan Highway Feeder: Birgunj Dryport → Simara → Pathlaiya',
    nepaliName: 'त्रिभुवन राजपथ सहायक: वीरगञ्ज सुख्खा बन्दरगाह → सिमरा → पथलैया',
    corridor: 'Central Industrial Corridor',
    district: 'Parsa / Bara',
    status: 'open',
    lengthKm: 27.8,
    submergedLengthKm: 0.0,
    maxWaterDepthMeters: 0.0,
    color: '#10B981', // Green
    breachCause: 'Elevated multi-lane trade arterial. Zero flood intrusion.',
    clearanceAdvice: 'Full open transit for all container trucks and emergency ambulances.',
    path: [
      [27.01, 84.88], // Birgunj
      [27.10, 84.93],
      [27.16, 84.96], // Simara
      [27.21, 84.99], // Pathlaiya
    ],
  },
  {
    id: 'road_f03_bhairahawa_butwal',
    highwayCode: 'F03',
    name: 'Siddhartha Highway Feeder: Belahiya Border → Bhairahawa → Butwal',
    nepaliName: 'सिद्धार्थ राजमार्ग सहायक: बेलहिया सीमा → भैरहवा → बुटवल',
    corridor: 'Tinau & Rohini Basin',
    district: 'Rupandehi',
    status: 'open',
    lengthKm: 22.5,
    submergedLengthKm: 0.0,
    maxWaterDepthMeters: 0.0,
    color: '#10B981', // Green
    breachCause: 'Engineered drainage operational along modern 6-lane trade corridor.',
    clearanceAdvice: 'Completely open. Key logistics corridor for western relief operations.',
    path: [
      [27.46, 83.47], // Belahiya
      [27.50, 83.45], // Bhairahawa
      [27.60, 83.46],
      [27.70, 83.46], // Butwal
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 2. CRITICAL TERAI BRIDGES & BARRAGE STATUS
// ─────────────────────────────────────────────────────────────────────────────
export const TERAI_BRIDGES: TeraiBridge[] = [
  {
    id: 'bridge_koshi_barrage',
    name: 'Saptakoshi Barrage (56 Sluice Gates)',
    nepaliName: 'सप्तकोशी ब्यारेज (५६ ढोका)',
    river: 'Saptakoshi River',
    district: 'Sunsari / Saptari Border',
    coords: [26.5218, 86.9234],
    status: 'critical_danger',
    trafficStatus: 'restricted_single_lane',
    dischargeCusecs: 462000,
    waterLevelMeters: 34.8,
    dangerLevelMeters: 32.0,
    structuralStatus: 'All 56 gates opened to prevent embankment breach. Red danger light flashing.',
    notes: 'Heavy commercial transit restricted. 1 convoy at a time under Armed Police Force regulation.',
  },
  {
    id: 'bridge_bagmati_karmaiya',
    name: 'Bagmati Karmaiya Highway Bridge',
    nepaliName: 'बागमती कर्मैया राजमार्ग पुल',
    river: 'Bagmati River',
    district: 'Sarlahi / Rautahat Border',
    coords: [27.1124, 85.3812],
    status: 'high_warning',
    trafficStatus: 'open_normal',
    dischargeCusecs: 198000,
    waterLevelMeters: 16.4,
    dangerLevelMeters: 17.5,
    structuralStatus: 'Piers stable. High silt load and driftwood clearance operations active.',
    notes: 'Key connection between Eastern and Western Terai on Mahendra Highway.',
  },
  {
    id: 'bridge_lalbakeya_tikulia',
    name: 'Lalbakeya Tikulia Embankment Bridge & Causeway',
    nepaliName: 'लालबकैया टिकुलिया तटबन्ध पुल तथा कजवे',
    river: 'Lalbakeya River',
    district: 'Rautahat (Gaur)',
    coords: [26.7912, 85.2534],
    status: 'critical_danger',
    trafficStatus: 'closed',
    dischargeCusecs: 84000,
    waterLevelMeters: 9.8,
    dangerLevelMeters: 7.5,
    structuralStatus: 'SUBMERGED & APPROACH CAUSEWAY COLLAPSED (2.4m water flowing over deck).',
    notes: 'Completely closed. Road disconnected from Gaur to Banjaraha and India border.',
  },
  {
    id: 'bridge_narayani_narayangarh',
    name: 'Narayani River Bridge (Narayangarh)',
    nepaliName: 'नारायणी नदी पुल (नारायणगढ)',
    river: 'Narayani (Gandaki) River',
    district: 'Chitwan / Nawalpur Border',
    coords: [27.7018, 84.4215],
    status: 'high_warning',
    trafficStatus: 'open_normal',
    dischargeCusecs: 285000,
    waterLevelMeters: 10.6,
    dangerLevelMeters: 11.5,
    structuralStatus: 'Water 90cm below danger mark. Speed limited to 30 km/h.',
    notes: 'Vital bottleneck linking Kathmandu Valley and Western Terai.',
  },
  {
    id: 'bridge_karnali_chisapani',
    name: 'Karnali Chisapani Cable-Stayed Bridge',
    nepaliName: 'कर्णाली चिसापानी केबल पुल',
    river: 'Karnali River',
    district: 'Kailali / Bardiya Border',
    coords: [28.6432, 81.2842],
    status: 'monitored_safe',
    trafficStatus: 'open_normal',
    dischargeCusecs: 312000,
    waterLevelMeters: 11.2,
    dangerLevelMeters: 12.8,
    structuralStatus: 'Single-tower cable-stayed bridge functioning normally. Approaches dry.',
    notes: 'Gateway to Far-Western Terai (Dhangadhi / Mahendranagar).',
  },
  {
    id: 'bridge_rapti_sikta',
    name: 'West Rapti Sikta Barrage & Bridge',
    nepaliName: 'पश्चिम राप्ती सिक्टा ब्यारेज तथा पुल',
    river: 'West Rapti River',
    district: 'Banke',
    coords: [28.0845, 81.9823],
    status: 'critical_danger',
    trafficStatus: 'restricted_single_lane',
    dischargeCusecs: 185000,
    waterLevelMeters: 8.9,
    dangerLevelMeters: 8.2,
    structuralStatus: 'All 18 sluice gates open. Overflowing into lower right canal bank.',
    notes: 'Downstream villages (Holiya, Betahani) cut off by backwaters.',
  },
  {
    id: 'bridge_babai_chepang',
    name: 'Babai River Chepang Bridge',
    nepaliName: 'बबई नदी चेपाङ पुल',
    river: 'Babai River',
    district: 'Bardiya',
    coords: [28.3512, 81.3912],
    status: 'high_warning',
    trafficStatus: 'restricted_single_lane',
    dischargeCusecs: 92000,
    waterLevelMeters: 6.8,
    dangerLevelMeters: 7.1,
    structuralStatus: 'Eastern approach ramp submerged under 30cm water. Army tractor escort operating.',
    notes: 'Connecting Gulariya district headquarters with Mahendra Highway.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 3. HIGH-IMPACT ISOLATED COMMUNITIES (CUT-OFF BY ROAD BREACHES)
// ─────────────────────────────────────────────────────────────────────────────
export const ISOLATED_COMMUNITIES: IsolatedCommunity[] = [
  {
    id: 'isolated_gaur_border',
    name: 'Gaur Customs & Border Wards 2, 3, 4',
    nepaliName: 'गौर भन्सार तथा सीमावर्ती वडा २, ३, ४',
    district: 'Rautahat',
    coords: [26.7624, 85.2789],
    populationCutOff: 18400,
    estimatedIsolationDays: 5,
    submergedAccessRoad: 'Postal Highway (H12) submerged under 2.2m water; Tikulia causeway collapsed.',
    emergencyAccessMethod: 'boat_and_helicopter',
    nearestDepot: 'Chandranigahapur Military Logistics Base (38 km North)',
    urgency: 'critical',
  },
  {
    id: 'isolated_bhajani_ward3',
    name: 'Bhajani Municipality & Lalbojhi Wards 3 & 7',
    nepaliName: 'भजनी नगरपालिका तथा लालबोझी वडा ३ र ७',
    district: 'Kailali',
    coords: [28.5812, 80.9523],
    populationCutOff: 12200,
    estimatedIsolationDays: 4,
    submergedAccessRoad: 'Postal Highway submerged 1.9m at Patharaiya river junction.',
    emergencyAccessMethod: 'boat_and_helicopter',
    nearestDepot: 'Lamki Army Staging Post (24 km North via high ridge)',
    urgency: 'critical',
  },
  {
    id: 'isolated_holiya_fattepur',
    name: 'Holiya, Kamdi & Fattepur Flood Plain Wards',
    nepaliName: 'होलिया, कम्दी तथा फत्तेपुर बाढी क्षेत्र',
    district: 'Banke',
    coords: [27.9812, 81.8845],
    populationCutOff: 14800,
    estimatedIsolationDays: 3,
    submergedAccessRoad: 'Postal Highway submerged 1.7m due to Rapti River delta surge.',
    emergencyAccessMethod: 'heavy_tractor_only',
    nearestDepot: 'Kohalpur Red Cross Central Warehouse (26 km North)',
    urgency: 'high',
  },
  {
    id: 'isolated_prakashpur_madhuban',
    name: 'Prakashpur & Madhuban Koshi Buffer Communities',
    nepaliName: 'प्रकाशपुर तथा मधुवन कोशी बफर क्षेत्र',
    district: 'Sunsari',
    coords: [26.7212, 87.0823],
    populationCutOff: 9600,
    estimatedIsolationDays: 3,
    submergedAccessRoad: 'West canal road breached by Koshi channel; 1.3m water depth.',
    emergencyAccessMethod: 'high_clearance_convoy',
    nearestDepot: 'Duhabi Logistics Warehouse & Dharan Base (22 km North-East)',
    urgency: 'high',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 4. SUMMARY TELEMETRY COMPUTATIONS
// ─────────────────────────────────────────────────────────────────────────────
export const getRoadDisruptionStats = () => {
  const totalRoadKm = TERAI_ROAD_SEGMENTS.reduce((sum, s) => sum + s.lengthKm, 0);
  const totalSubmergedKm = TERAI_ROAD_SEGMENTS.reduce((sum, s) => sum + s.submergedLengthKm, 0);
  const totalRestrictedKm = TERAI_ROAD_SEGMENTS
    .filter((s) => s.status === 'restricted')
    .reduce((sum, s) => sum + s.lengthKm, 0);
  const totalOpenKm = TERAI_ROAD_SEGMENTS
    .filter((s) => s.status === 'open')
    .reduce((sum, s) => sum + s.lengthKm, 0);

  const totalIsolatedPopulation = ISOLATED_COMMUNITIES.reduce(
    (sum, c) => sum + c.populationCutOff,
    0
  );

  const criticalBridgesCount = TERAI_BRIDGES.filter((b) => b.status === 'critical_danger').length;
  const warningBridgesCount = TERAI_BRIDGES.filter((b) => b.status === 'high_warning').length;

  return {
    totalRoadKm: parseFloat(totalRoadKm.toFixed(1)),
    totalSubmergedKm: parseFloat(totalSubmergedKm.toFixed(1)),
    totalRestrictedKm: parseFloat(totalRestrictedKm.toFixed(1)),
    totalOpenKm: parseFloat(totalOpenKm.toFixed(1)),
    submergedPercent: parseFloat(((totalSubmergedKm / totalRoadKm) * 100).toFixed(1)),
    totalIsolatedPopulation,
    isolatedCommunitiesCount: ISOLATED_COMMUNITIES.length,
    criticalBridgesCount,
    warningBridgesCount,
    totalBridgesMonitored: TERAI_BRIDGES.length,
  };
};
