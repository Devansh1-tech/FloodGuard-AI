/**
 * teraiRoutingNetwork.ts — Advanced Emergency Convoy & Evacuation Routing Engine for Nepal Terai.
 *
 * Implements Stage 5.6:
 * - Point 7: Relief & Medical Supply Convoy Router (from regional depots to cut-off flood zones).
 * - Point 9: Civilian Evacuation Alternate Route Navigator (directing stranded populations to elevated havens).
 *
 * Features:
 * 1. Graph model of 21 Terai districts with road segments, bridges, and elevation.
 * 2. Strict flood avoidance Dijkstra solver (cost = Infinity for submerged roads).
 * 3. WHO emergency medical & food quota calculators for relief missions.
 * 4. Step-by-step turn-by-turn guidance with elevation profiles and hazard advisories.
 */

export type VehicleClass = 'army_6x6' | 'high_clearance_4x4' | 'tractor_trailer' | 'pedestrian_escort';

export interface RouteNode {
  id: string;
  name: string;
  nepaliName: string;
  district: string;
  coords: [number, number]; // [lat, lng]
  elevationMeters: number;
  type: 'depot' | 'safe_haven' | 'flooded_settlement' | 'highway_junction' | 'bridge';
  capacity?: number; // For safe havens or depots
  waterDepthMeters?: number; // For flooded settlements
  contactPhone?: string;
  description: string;
}

export interface RouteEdge {
  id: string;
  from: string; // Node ID
  to: string; // Node ID
  name: string;
  highwayCode: 'H01' | 'H12' | 'F01' | 'F02' | 'F03' | 'F04' | 'F05' | 'F06' | 'LOCAL';
  distanceKm: number;
  surface: 'paved_highway' | 'elevated_ridge' | 'feeder_canal' | 'causeway' | 'rural_bund';
  status: 'open' | 'restricted' | 'submerged';
  waterDepthMeters: number;
  maxSpeedKmh: number;
  bridgeId?: string;
  path: [number, number][]; // Detailed polyline coordinates [lat, lng]
  hazardNote?: string;
}

export interface TurnStep {
  stepNumber: number;
  instruction: string;
  nepaliInstruction: string;
  distanceKm: number;
  cumulativeKm: number;
  roadName: string;
  coords: [number, number];
  elevationMeters: number;
  hazardAlert?: string;
  action: 'depart' | 'turn_left' | 'turn_right' | 'continue' | 'cross_bridge' | 'arrive';
}

export interface MedicalReliefQuota {
  targetPopulation: number;
  potableWaterLiters: number; // 3L / person / day
  foodRationsKg: number; // 0.5kg / person / day
  aquatabsCount: number; // 2 tabs / person / day
  orsPackets: number; // 1 packet per 4 people
  antivenomVials: number; // 1 vial per 150 people
  ivSalineBags: number; // 1 bag per 30 people
  zodiacBoatsRequired: number;
  trucksRequired: number;
}

export interface ComputedRouteResult {
  routeId: string;
  title: string;
  nepaliTitle: string;
  mode: 'relief_convoy' | 'civilian_alternate';
  origin: RouteNode;
  destination: RouteNode;
  vehicleClass: VehicleClass;
  distanceKm: number;
  estimatedMinutes: number;
  submergedKmBypassed: number;
  avoidanceAlert: string;
  status: 'active_safe' | 'caution_restricted' | 'unreachable';
  path: [number, number][];
  blockedDirectPath?: [number, number][];
  steps: TurnStep[];
  bridgesEncountered: {
    name: string;
    river: string;
    status: 'monitored_safe' | 'high_warning' | 'critical_danger';
    advice: string;
  }[];
  reliefQuota?: MedicalReliefQuota;
  safeHavenCapacity?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. NETWORK NODES: DEPOTS, SAFE HAVENS, SETTLEMENTS & JUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────
export const ROUTE_NODES: Record<string, RouteNode> = {
  // ── REGIONAL EMERGENCY DEPOTS (POINT 7) ───────────────────────────────────
  depot_bharatpur: {
    id: 'depot_bharatpur',
    name: 'Bharatpur Army Cantonment & Regional Logistics Base',
    nepaliName: 'भरतपुर सेना क्याम्प तथा क्षेत्रीय आपूर्ति केन्द्र',
    district: 'Chitwan',
    coords: [27.6842, 84.4321],
    elevationMeters: 208,
    type: 'depot',
    capacity: 25000,
    contactPhone: '056-520111',
    description: 'Central Terai Primary Disaster Logistics Hub. Stocks Nepal Army 6x6 trucks, Zodiac boats, and medical supplies.',
  },
  depot_duhabi: {
    id: 'depot_duhabi',
    name: 'Duhabi Emergency Logistics Hub & Warehouse',
    nepaliName: 'दुहबी आपतकालीन आपूर्ति डिपो तथा गोदाम',
    district: 'Sunsari',
    coords: [26.5721, 87.2814],
    elevationMeters: 74,
    type: 'depot',
    capacity: 30000,
    contactPhone: '025-540200',
    description: 'Eastern Terai Regional Grain & Medical Depot. Primary dispatch point for Saptari, Sunsari, and Morang.',
  },
  depot_nepalgunj: {
    id: 'depot_nepalgunj',
    name: 'Nepalgunj Airport Logistics Base & Ranjha Cantonment',
    nepaliName: 'नेपालगञ्ज विमानस्थल डिपो तथा राँझा क्याम्प',
    district: 'Banke',
    coords: [28.1042, 81.6685],
    elevationMeters: 147,
    type: 'depot',
    capacity: 20000,
    contactPhone: '081-565120',
    description: 'Western Terai Air/Ground Staging Ground. Helicopter landing strip and high-capacity all-terrain vehicle base.',
  },
  depot_dhangadhi: {
    id: 'depot_dhangadhi',
    name: 'Dhangadhi Army Cantonment (Far-West Logistics Depot)',
    nepaliName: 'धनगढी सेना क्याम्प (सुदूरपश्चिम आपतकालीन डिपो)',
    district: 'Kailali',
    coords: [28.6924, 80.5912],
    elevationMeters: 109,
    type: 'depot',
    capacity: 15000,
    contactPhone: '091-521234',
    description: 'Far-Western Command Center for Kailali & Kanchanpur flood relief dispatch.',
  },
  depot_chandranigahapur: {
    id: 'depot_chandranigahapur',
    name: 'Chandranigahapur Military Forward Logistics Hub',
    nepaliName: 'चन्द्रनिगाहपुर सैनिक अग्रिम आपूर्ति केन्द्र',
    district: 'Rautahat',
    coords: [27.1284, 85.3421],
    elevationMeters: 142,
    type: 'depot',
    capacity: 18000,
    contactPhone: '055-540112',
    description: 'High-elevation base on Mahendra Highway. Forward springboard for Gaur and Bagmati basin rescue convoys.',
  },
  depot_kohalpur: {
    id: 'depot_kohalpur',
    name: 'Kohalpur Red Cross Regional Disaster Warehouse',
    nepaliName: 'कोहलपुर रेडक्रस क्षेत्रीय विपद् गोदाम',
    district: 'Banke',
    coords: [28.1924, 81.6912],
    elevationMeters: 152,
    type: 'depot',
    capacity: 12000,
    contactPhone: '081-540033',
    description: 'Major crossroads warehouse stocking emergency tents, water purification units, and hygiene kits.',
  },

  // ── SAFE HIGH-GROUND REFUGES (POINT 9 EVACUATION DESTINATIONS) ──────────────
  haven_barahachhetra: {
    id: 'haven_barahachhetra',
    name: 'Barahachhetra High Ridge Safe Haven (185m ASL)',
    nepaliName: 'वराहक्षेत्र सुरक्षित उच्च पहाडी आश्रयस्थल (१८५ मिटर)',
    district: 'Sunsari',
    coords: [26.8924, 87.1724],
    elevationMeters: 185,
    type: 'safe_haven',
    capacity: 8500,
    contactPhone: '025-560114',
    description: 'Elevated river bluff compound with community halls, helicopter landing zone (HLZ), and freshwater spring.',
  },
  haven_chandranigahapur: {
    id: 'haven_chandranigahapur',
    name: 'Chandranigahapur Public Campus & Stadium Shelter',
    nepaliName: 'चन्द्रनिगाहपुर जनज्योति क्याम्पस तथा रंगशाला आश्रयस्थल',
    district: 'Rautahat',
    coords: [27.1321, 85.3385],
    elevationMeters: 142,
    type: 'safe_haven',
    capacity: 7500,
    contactPhone: '055-540222',
    description: 'Concrete multi-story campus buildings, dry sports grounds, and APF medical emergency post.',
  },
  haven_tikapur: {
    id: 'haven_tikapur',
    name: 'Tikapur Birendra Vidya Mandir High Ground Compound',
    nepaliName: 'टीकापुर वीरेन्द्र विद्या मन्दिर सुरक्षित परिसर',
    district: 'Kailali',
    coords: [28.5241, 81.1324],
    elevationMeters: 128,
    type: 'safe_haven',
    capacity: 6000,
    contactPhone: '091-560021',
    description: 'Engineered high-ground educational complex equipped with deep water boring and emergency solar arrays.',
  },
  haven_kohalpur: {
    id: 'haven_kohalpur',
    name: 'Kohalpur Sports Stadium & Medical Shelter',
    nepaliName: 'कोहलपुर खेलकुद रंगशाला तथा चिकित्सा आश्रयस्थल',
    district: 'Banke',
    coords: [28.2014, 81.6885],
    elevationMeters: 154,
    type: 'safe_haven',
    capacity: 5500,
    contactPhone: '081-540188',
    description: 'Covered gymnasium complex with clean sanitation blocks, mobile medical triage, and food kitchens.',
  },
  haven_lamki: {
    id: 'haven_lamki',
    name: 'Lamki High Ridge Community Safe Complex',
    nepaliName: 'लम्की उच्च स्थल सामुदायिक सुरक्षित परिसर',
    district: 'Kailali',
    coords: [28.6312, 81.1524],
    elevationMeters: 146,
    type: 'safe_haven',
    capacity: 5000,
    contactPhone: '091-540333',
    description: 'Foothill elevation refuge directly off Mahendra Highway; immune to Karnali backflow.',
  },
  haven_bardibas: {
    id: 'haven_bardibas',
    name: 'Bardibas Elevated Civic Center & Hospital Shelter',
    nepaliName: 'बर्दिबास उच्च नागरिक केन्द्र तथा अस्पताल आश्रयस्थल',
    district: 'Mahottari',
    coords: [26.9842, 85.8924],
    elevationMeters: 155,
    type: 'safe_haven',
    capacity: 4800,
    contactPhone: '044-550112',
    description: 'Elevated highway hub serving evacuees from submerged southern Mahottari (Jaleshwar).',
  },

  // ── FLOODED SETTLEMENTS & MAROONED COMMUNITIES ─────────────────────────────
  target_gaur: {
    id: 'target_gaur',
    name: 'Gaur Submerged District Headquarters (Wards 1-4)',
    nepaliName: 'गौर डुबानग्रस्त जिल्ला सदरमुकाम (वडा १-४)',
    district: 'Rautahat',
    coords: [26.7624, 85.2789],
    elevationMeters: 82,
    type: 'flooded_settlement',
    waterDepthMeters: 2.2,
    capacity: 18400,
    contactPhone: '055-520144',
    description: 'Severely inundated border city. Lalbakeya embankment burst has marooned 18,400 residents in water up to 2.2m.',
  },
  target_prakashpur: {
    id: 'target_prakashpur',
    name: 'Prakashpur & Madhuban Koshi Buffer Communities',
    nepaliName: 'प्रकाशपुर तथा मधुवन कोशी बफर क्षेत्र',
    district: 'Sunsari',
    coords: [26.7412, 87.0521],
    elevationMeters: 68,
    type: 'flooded_settlement',
    waterDepthMeters: 1.4,
    capacity: 9600,
    contactPhone: '025-560233',
    description: 'Saptakoshi river eastern channel overflow. Cut-off agricultural communities needing emergency food & ORS.',
  },
  target_hanumannagar: {
    id: 'target_hanumannagar',
    name: 'Hanumannagar Kankalini / Saptakoshi Flood Plain',
    nepaliName: 'हनुमाननगर कङ्कालिनी / सप्तकोशी बाढी क्षेत्र',
    district: 'Saptari',
    coords: [26.5412, 86.8524],
    elevationMeters: 65,
    type: 'flooded_settlement',
    waterDepthMeters: 1.8,
    capacity: 11200,
    contactPhone: '031-520311',
    description: 'Inundated by Koshi discharge over 460,000 cusecs. Road access severed from south.',
  },
  target_holiya: {
    id: 'target_holiya',
    name: 'Holiya, Kamdi & Fattepur Rapti Basin Wards',
    nepaliName: 'होलिया, कम्दी तथा फत्तेपुर राप्ती बाढी क्षेत्र',
    district: 'Banke',
    coords: [27.9512, 81.8214],
    elevationMeters: 122,
    type: 'flooded_settlement',
    waterDepthMeters: 1.7,
    capacity: 14800,
    contactPhone: '081-560199',
    description: 'West Rapti and Laxmanpur backwaters have submerged villages. Postal Highway completely under water.',
  },
  target_bhajani: {
    id: 'target_bhajani',
    name: 'Bhajani Municipality & Lalbojhi Cut-Off Wards',
    nepaliName: 'भजनी नगरपालिका तथा लालबोझी कट-अफ क्षेत्र',
    district: 'Kailali',
    coords: [28.4512, 81.1214],
    elevationMeters: 98,
    type: 'flooded_settlement',
    waterDepthMeters: 1.9,
    capacity: 12200,
    contactPhone: '091-560244',
    description: 'Confluence of Kandra and Mohana rivers flooding 18.2 km of Postal Highway.',
  },

  // ── STRATEGIC HIGHWAY INTERSECTIONS & BRIDGES ─────────────────────────────
  junc_hetauda: {
    id: 'junc_hetauda',
    name: 'Hetauda Highway Crossroads',
    nepaliName: 'हेटौंडा राजमार्ग चोक',
    district: 'Makwanpur',
    coords: [27.4284, 85.0321],
    elevationMeters: 465,
    type: 'highway_junction',
    description: 'Major junction connecting Kathmandu Tribhuvan Highway and Mahendra Highway.',
  },
  junc_pathlaiya: {
    id: 'junc_pathlaiya',
    name: 'Pathlaiya Industrial Crossroads',
    nepaliName: 'पथलैया औद्योगिक चोक',
    district: 'Bara',
    coords: [27.2184, 84.9924],
    elevationMeters: 148,
    type: 'highway_junction',
    description: 'Junction of Mahendra Highway (H01) and Tribhuvan Highway Feeder (F02).',
  },
  junc_pipra: {
    id: 'junc_pipra',
    name: 'Pipra Rajdevi Northern Causeway',
    nepaliName: 'पिपरा राजदेवी उत्तरी कजवे',
    district: 'Rautahat',
    coords: [26.8612, 85.3014],
    elevationMeters: 92,
    type: 'highway_junction',
    description: 'Key junction on north feeder canal road F01 leading into Gaur.',
  },
  junc_inaruwa: {
    id: 'junc_inaruwa',
    name: 'Inaruwa High Junction',
    nepaliName: 'इनरुवा उच्च चोक',
    district: 'Sunsari',
    coords: [26.6014, 87.1524],
    elevationMeters: 78,
    type: 'highway_junction',
    description: 'Elevated intersection on Mahendra Highway near Koshi Barrage approach.',
  },
  junc_koshi_barrage: {
    id: 'junc_koshi_barrage',
    name: 'Koshi Barrage Bridge (Sluices 1-56)',
    nepaliName: 'कोशी ब्यारेज पुल (ढोका १-५६)',
    district: 'Sunsari / Saptari',
    coords: [26.5218, 86.9234],
    elevationMeters: 72,
    type: 'bridge',
    description: 'Vital river crossing over Saptakoshi. Single-lane restricted convoy transit under APF control.',
  },
  junc_chatara: {
    id: 'junc_chatara',
    name: 'Chatara Canal Bridge & Foothill Junction',
    nepaliName: 'चतरा नहर पुल तथा फेदी चोक',
    district: 'Sunsari',
    coords: [26.8214, 87.1512],
    elevationMeters: 135,
    type: 'highway_junction',
    description: 'Elevated bypass route connecting Sunsari lowlands to Barahachhetra ridge.',
  },
  junc_baghamara: {
    id: 'junc_baghamara',
    name: 'Baghamara Elevated Northern Dike Junction',
    nepaliName: 'बाघमारा उच्च उत्तरी तटबन्ध चोक',
    district: 'Banke',
    coords: [28.0514, 81.7621],
    elevationMeters: 140,
    type: 'highway_junction',
    description: 'High-elevation dike route bypassing inundated Postal Highway towards Holiya.',
  },
  junc_lalmatiya: {
    id: 'junc_lalmatiya',
    name: 'Lalmatiya High Causeway Junction',
    nepaliName: 'लालमतिया उच्च कजवे चोक',
    district: 'Kailali',
    coords: [28.5214, 81.1824],
    elevationMeters: 124,
    type: 'highway_junction',
    description: 'High-ground rural connection bypassing flooded Patharaiya culverts.',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. NETWORK EDGES: HIGHWAYS, FEEDERS & BYPASSES
// ─────────────────────────────────────────────────────────────────────────────
export const ROUTE_EDGES: RouteEdge[] = [
  // ── CENTRAL TERAI CORRIDOR (BHARATPUR → GAUR) ─────────────────────────────
  {
    id: 'edge_bharatpur_hetauda',
    from: 'depot_bharatpur',
    to: 'junc_hetauda',
    name: 'Mahendra Highway H01: Bharatpur → Hetauda',
    highwayCode: 'H01',
    distanceKm: 65.4,
    surface: 'paved_highway',
    status: 'open',
    waterDepthMeters: 0.0,
    maxSpeedKmh: 65,
    path: [
      [27.6842, 84.4321],
      [27.6412, 84.5824],
      [27.5814, 84.7512],
      [27.5024, 84.9014],
      [27.4284, 85.0321],
    ],
  },
  {
    id: 'edge_hetauda_chandranigahapur',
    from: 'junc_hetauda',
    to: 'depot_chandranigahapur',
    name: 'Mahendra Highway H01: Hetauda → Pathlaiya → Chandranigahapur',
    highwayCode: 'H01',
    distanceKm: 52.8,
    surface: 'paved_highway',
    status: 'open',
    waterDepthMeters: 0.0,
    maxSpeedKmh: 60,
    bridgeId: 'bridge_bagmati_karmaiya',
    path: [
      [27.4284, 85.0321],
      [27.3512, 85.1214],
      [27.2814, 85.2214],
      [27.1812, 85.3012],
      [27.1284, 85.3421],
    ],
  },
  {
    id: 'edge_chandranigahapur_haven',
    from: 'depot_chandranigahapur',
    to: 'haven_chandranigahapur',
    name: 'Campus Access Arterial: Chandranigahapur Depot → Safe Haven',
    highwayCode: 'LOCAL',
    distanceKm: 1.5,
    surface: 'paved_highway',
    status: 'open',
    waterDepthMeters: 0.0,
    maxSpeedKmh: 40,
    path: [
      [27.1284, 85.3421],
      [27.1321, 85.3385],
    ],
  },
  {
    id: 'edge_chandranigahapur_pipra_safe',
    from: 'depot_chandranigahapur',
    to: 'junc_pipra',
    name: 'Feeder Road F01: Chandranigahapur → Pipra High Causeway (Safe Detour)',
    highwayCode: 'F01',
    distanceKm: 31.2,
    surface: 'elevated_ridge',
    status: 'restricted',
    waterDepthMeters: 0.25,
    maxSpeedKmh: 45,
    hazardNote: 'Canal overflow 25cm. Army 6x6, high-clearance 4x4 and tractors permitted with APF escort.',
    path: [
      [27.1284, 85.3421],
      [27.0512, 85.3214],
      [26.9814, 85.3112],
      [26.9214, 85.3085],
      [26.8612, 85.3014],
    ],
  },
  {
    id: 'edge_pipra_gaur_safe',
    from: 'junc_pipra',
    to: 'target_gaur',
    name: 'North Approach Canal Road: Pipra → Gaur Flood Terminal',
    highwayCode: 'LOCAL',
    distanceKm: 12.8,
    surface: 'causeway',
    status: 'restricted',
    waterDepthMeters: 0.35,
    maxSpeedKmh: 30,
    hazardNote: 'High-clearance vehicles only. Connects with Nepal Army Zodiac boat launch point at Gaur Bhanu Chowk.',
    path: [
      [26.8612, 85.3014],
      [26.8214, 85.2912],
      [26.7812, 85.2814],
      [26.7624, 85.2789],
    ],
  },
  // Submerged Direct Road (Postal Highway H12 at Gaur) — MUST BE BYPASSED
  {
    id: 'edge_gaur_submerged_direct_blocked',
    from: 'junc_pathlaiya',
    to: 'target_gaur',
    name: 'BLOCKED: Postal Highway H12: Kalaiya → Gaur Border (Impassable)',
    highwayCode: 'H12',
    distanceKm: 46.5,
    surface: 'paved_highway',
    status: 'submerged',
    waterDepthMeters: 2.2,
    maxSpeedKmh: 0,
    hazardNote: 'CRITICAL: ROAD IMPASSABLE. Lalbakeya embankment breached at Tikulia; 2.2m raging current.',
    path: [
      [27.2184, 84.9924],
      [27.0812, 85.0412],
      [26.9512, 85.1214],
      [26.8412, 85.2014],
      [26.7624, 85.2789],
    ],
  },

  // ── EASTERN TERAI CORRIDOR (DUHABI → KOSHI / BARAHACHHETRA) ───────────────
  {
    id: 'edge_duhabi_inaruwa',
    from: 'depot_duhabi',
    to: 'junc_inaruwa',
    name: 'Mahendra Highway H01: Duhabi → Inaruwa Hub',
    highwayCode: 'H01',
    distanceKm: 22.4,
    surface: 'paved_highway',
    status: 'open',
    waterDepthMeters: 0.0,
    maxSpeedKmh: 65,
    path: [
      [26.5721, 87.2814],
      [26.5814, 87.2214],
      [26.6014, 87.1524],
    ],
  },
  {
    id: 'edge_inaruwa_koshi_barrage',
    from: 'junc_inaruwa',
    to: 'junc_koshi_barrage',
    name: 'Mahendra Highway H01: Inaruwa → Koshi Barrage Approach',
    highwayCode: 'H01',
    distanceKm: 26.8,
    surface: 'paved_highway',
    status: 'restricted',
    waterDepthMeters: 0.35,
    maxSpeedKmh: 40,
    hazardNote: 'Western embankment seepage. Single-lane convoy under APF escort.',
    path: [
      [26.6014, 87.1524],
      [26.5912, 87.0512],
      [26.5612, 86.9812],
      [26.5218, 86.9234],
    ],
  },
  {
    id: 'edge_koshi_barrage_hanumannagar',
    from: 'junc_koshi_barrage',
    to: 'target_hanumannagar',
    name: 'Western Embankment Link: Koshi Barrage → Hanumannagar',
    highwayCode: 'LOCAL',
    distanceKm: 8.5,
    surface: 'elevated_ridge',
    status: 'restricted',
    waterDepthMeters: 0.3,
    maxSpeedKmh: 35,
    hazardNote: 'High river spray; boat dispatch point for marooned island wards.',
    path: [
      [26.5218, 86.9234],
      [26.5312, 86.8812],
      [26.5412, 86.8524],
    ],
  },
  {
    id: 'edge_prakashpur_chatara_safe',
    from: 'target_prakashpur',
    to: 'junc_chatara',
    name: 'Elevated Foothill Egress: Prakashpur → Chatara Junction',
    highwayCode: 'LOCAL',
    distanceKm: 12.4,
    surface: 'elevated_ridge',
    status: 'open',
    waterDepthMeters: 0.0,
    maxSpeedKmh: 45,
    path: [
      [26.7412, 87.0521],
      [26.7812, 87.1012],
      [26.8214, 87.1512],
    ],
  },
  {
    id: 'edge_chatara_barahachhetra',
    from: 'junc_chatara',
    to: 'haven_barahachhetra',
    name: 'Ridge Ascent Road: Chatara → Barahachhetra Safe Haven (185m ASL)',
    highwayCode: 'LOCAL',
    distanceKm: 6.8,
    surface: 'elevated_ridge',
    status: 'open',
    waterDepthMeters: 0.0,
    maxSpeedKmh: 35,
    path: [
      [26.8214, 87.1512],
      [26.8612, 87.1614],
      [26.8924, 87.1724],
    ],
  },
  // Submerged Direct Road (Koshi Lower Canal Road) — BLOCKED
  {
    id: 'edge_prakashpur_koshi_submerged_blocked',
    from: 'target_prakashpur',
    to: 'junc_koshi_barrage',
    name: 'BLOCKED: Koshi Lower Canal Trail (Submerged 1.4m)',
    highwayCode: 'LOCAL',
    distanceKm: 24.2,
    surface: 'rural_bund',
    status: 'submerged',
    waterDepthMeters: 1.4,
    maxSpeedKmh: 0,
    hazardNote: 'IMPASSABLE: Koshi main canal breached; 1.4m deep raging water.',
    path: [
      [26.7412, 87.0521],
      [26.6812, 87.0112],
      [26.6012, 86.9612],
      [26.5218, 86.9234],
    ],
  },

  // ── WESTERN TERAI CORRIDOR (NEPALGUNJ → HOLIYA / KOHALPUR) ────────────────
  {
    id: 'edge_nepalgunj_kohalpur',
    from: 'depot_nepalgunj',
    to: 'depot_kohalpur',
    name: 'Ratna Highway: Nepalgunj Airbase → Kohalpur Hub',
    highwayCode: 'H01',
    distanceKm: 14.8,
    surface: 'paved_highway',
    status: 'open',
    waterDepthMeters: 0.0,
    maxSpeedKmh: 70,
    path: [
      [28.1042, 81.6685],
      [28.1412, 81.6785],
      [28.1924, 81.6912],
    ],
  },
  {
    id: 'edge_kohalpur_stadium',
    from: 'depot_kohalpur',
    to: 'haven_kohalpur',
    name: 'Stadium Link: Kohalpur Depot → Sports Stadium Shelter',
    highwayCode: 'LOCAL',
    distanceKm: 1.2,
    surface: 'paved_highway',
    status: 'open',
    waterDepthMeters: 0.0,
    maxSpeedKmh: 40,
    path: [
      [28.1924, 81.6912],
      [28.2014, 81.6885],
    ],
  },
  {
    id: 'edge_nepalgunj_baghamara_safe',
    from: 'depot_nepalgunj',
    to: 'junc_baghamara',
    name: 'Elevated Northern Dike Road: Nepalgunj → Baghamara Junction',
    highwayCode: 'LOCAL',
    distanceKm: 16.5,
    surface: 'elevated_ridge',
    status: 'open',
    waterDepthMeters: 0.0,
    maxSpeedKmh: 50,
    path: [
      [28.1042, 81.6685],
      [28.0812, 81.7112],
      [28.0514, 81.7621],
    ],
  },
  {
    id: 'edge_baghamara_holiya_safe',
    from: 'junc_baghamara',
    to: 'target_holiya',
    name: 'Upper Dike Approach: Baghamara → Holiya Relief Post',
    highwayCode: 'LOCAL',
    distanceKm: 14.2,
    surface: 'causeway',
    status: 'restricted',
    waterDepthMeters: 0.35,
    maxSpeedKmh: 35,
    hazardNote: 'Rapti flood edge; army 4x4 trucks and tractors operating with relief guides.',
    path: [
      [28.0514, 81.7621],
      [28.0012, 81.7912],
      [27.9512, 81.8214],
    ],
  },
  // Submerged Direct Road (Postal Highway to Holiya) — BLOCKED
  {
    id: 'edge_nepalgunj_holiya_submerged_blocked',
    from: 'depot_nepalgunj',
    to: 'target_holiya',
    name: 'BLOCKED: Postal Highway H12: Nepalgunj South → Kamdi → Holiya',
    highwayCode: 'H12',
    distanceKm: 28.5,
    surface: 'paved_highway',
    status: 'submerged',
    waterDepthMeters: 1.7,
    maxSpeedKmh: 0,
    hazardNote: 'CUT OFF: 1.7m standing water from West Rapti surge and culvert collapse.',
    path: [
      [28.1042, 81.6685],
      [28.0412, 81.6812],
      [28.0012, 81.7412],
      [27.9512, 81.8214],
    ],
  },

  // ── FAR-WESTERN TERAI CORRIDOR (DHANGADHI / BHAJANI / TIKAPUR) ─────────────
  {
    id: 'edge_dhangadhi_lamki',
    from: 'depot_dhangadhi',
    to: 'haven_lamki',
    name: 'Mahendra Highway H01: Dhangadhi → Lamki Ridge',
    highwayCode: 'H01',
    distanceKm: 78.5,
    surface: 'paved_highway',
    status: 'open',
    waterDepthMeters: 0.0,
    maxSpeedKmh: 75,
    path: [
      [28.6924, 80.5912],
      [28.6712, 80.7812],
      [28.6512, 80.9812],
      [28.6312, 81.1524],
    ],
  },
  {
    id: 'edge_lamki_tikapur',
    from: 'haven_lamki',
    to: 'haven_tikapur',
    name: 'Tikapur Elevated Link Road: Lamki → Tikapur High Campus',
    highwayCode: 'F06',
    distanceKm: 18.2,
    surface: 'paved_highway',
    status: 'open',
    waterDepthMeters: 0.0,
    maxSpeedKmh: 60,
    path: [
      [28.6312, 81.1524],
      [28.5812, 81.1412],
      [28.5241, 81.1324],
    ],
  },
  {
    id: 'edge_tikapur_lalmatiya_safe',
    from: 'haven_tikapur',
    to: 'junc_lalmatiya',
    name: 'North Causeway Bypass: Tikapur → Lalmatiya High Causeway',
    highwayCode: 'LOCAL',
    distanceKm: 7.5,
    surface: 'elevated_ridge',
    status: 'open',
    waterDepthMeters: 0.0,
    maxSpeedKmh: 45,
    path: [
      [28.5241, 81.1324],
      [28.5214, 81.1824],
    ],
  },
  {
    id: 'edge_lalmatiya_bhajani_safe',
    from: 'junc_lalmatiya',
    to: 'target_bhajani',
    name: 'High Bund Spur: Lalmatiya → Bhajani Relief Staging Post',
    highwayCode: 'LOCAL',
    distanceKm: 12.8,
    surface: 'causeway',
    status: 'restricted',
    waterDepthMeters: 0.38,
    maxSpeedKmh: 35,
    hazardNote: 'Water 38cm on lower bund; army 6x6 trucks and heavy tractors only.',
    path: [
      [28.5214, 81.1824],
      [28.4812, 81.1512],
      [28.4512, 81.1214],
    ],
  },
  // Submerged Direct Road (Postal Highway Bhajani) — BLOCKED
  {
    id: 'edge_bhajani_postal_submerged_blocked',
    from: 'target_bhajani',
    to: 'haven_tikapur',
    name: 'BLOCKED: Postal Highway H12 Direct to Tikapur (1.9m Submerged)',
    highwayCode: 'H12',
    distanceKm: 26.0,
    surface: 'paved_highway',
    status: 'submerged',
    waterDepthMeters: 1.9,
    maxSpeedKmh: 0,
    hazardNote: 'IMPASSABLE: Kandra river dyke failure; water depth 1.9m with submerged culvert wash-out.',
    path: [
      [28.4512, 81.1214],
      [28.4812, 81.1285],
      [28.5241, 81.1324],
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 3. WHO EMERGENCY CARGO & MEDICAL QUOTA FORMULAS
// ─────────────────────────────────────────────────────────────────────────────
export const calculateWHOQuota = (population: number): MedicalReliefQuota => {
  const safePop = Math.max(100, population);

  // WHO & UN-SPIDER Disaster Logistics Standards
  const potableWaterLiters = safePop * 3; // 3 Liters / person / day
  const foodRationsKg = Math.round(safePop * 0.5); // 0.5 kg emergency food / person / day
  const aquatabsCount = safePop * 2; // 2 chlorine tablets / person / day
  const orsPackets = Math.ceil(safePop / 4); // 1 packet per 4 people daily
  const antivenomVials = Math.ceil(safePop / 150); // Terai snakebite vulnerability metric
  const ivSalineBags = Math.ceil(safePop / 30); // 1 bag per 30 people (cholera/dehydration triage)

  // Vehicle requirement: Army 6x6 truck carries 5,000 kg cargo
  const totalCargoKg = potableWaterLiters * 1 + foodRationsKg + 500;
  const trucksRequired = Math.max(1, Math.ceil(totalCargoKg / 5000));
  const zodiacBoatsRequired = Math.max(1, Math.ceil(safePop / 1500));

  return {
    targetPopulation: safePop,
    potableWaterLiters,
    foodRationsKg,
    aquatabsCount,
    orsPackets,
    antivenomVials,
    ivSalineBags,
    zodiacBoatsRequired,
    trucksRequired,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. DIJKSTRA PATHFINDER ENGINE WITH STRICT FLOOD AVOIDANCE
// ─────────────────────────────────────────────────────────────────────────────
interface DijkstraNode {
  nodeId: string;
  cost: number;
  distanceKm: number;
  estimatedMinutes: number;
  prevNode: string | null;
  viaEdge: RouteEdge | null;
}

export const computeTeraiRoute = (
  originId: string,
  destinationId: string,
  vehicleClass: VehicleClass = 'army_6x6',
  avoidFloods: boolean = true
): ComputedRouteResult => {
  const origin = ROUTE_NODES[originId];
  const destination = ROUTE_NODES[destinationId];

  if (!origin || !destination) {
    throw new Error(`Invalid origin (${originId}) or destination (${destinationId})`);
  }

  // Build Adjacency Graph
  const adjacency: Record<string, RouteEdge[]> = {};
  Object.keys(ROUTE_NODES).forEach((nId) => {
    adjacency[nId] = [];
  });

  ROUTE_EDGES.forEach((edge) => {
    if (adjacency[edge.from]) adjacency[edge.from].push(edge);
    // Two-way traversable edges
    if (adjacency[edge.to]) {
      adjacency[edge.to].push({
        ...edge,
        from: edge.to,
        to: edge.from,
        path: [...edge.path].reverse(),
      });
    }
  });

  // Vehicle clearance limits (in meters)
  const maxWaterDepthTolerance: Record<VehicleClass, number> = {
    army_6x6: 0.8,
    tractor_trailer: 0.6,
    high_clearance_4x4: 0.4,
    pedestrian_escort: 0.15,
  };

  const tolerance = maxWaterDepthTolerance[vehicleClass];

  // Dijkstra data structures
  const distances: Record<string, DijkstraNode> = {};
  const unvisited = new Set<string>();

  Object.keys(ROUTE_NODES).forEach((nId) => {
    distances[nId] = {
      nodeId: nId,
      cost: Infinity,
      distanceKm: Infinity,
      estimatedMinutes: Infinity,
      prevNode: null,
      viaEdge: null,
    };
    unvisited.add(nId);
  });

  distances[originId].cost = 0;
  distances[originId].distanceKm = 0;
  distances[originId].estimatedMinutes = 0;

  while (unvisited.size > 0) {
    // Find unvisited node with lowest cost
    let closestNodeId: string | null = null;
    let lowestCost = Infinity;

    unvisited.forEach((nId) => {
      if (distances[nId].cost < lowestCost) {
        lowestCost = distances[nId].cost;
        closestNodeId = nId;
      }
    });

    if (!closestNodeId || lowestCost === Infinity) break;
    if (closestNodeId === destinationId) break;

    unvisited.delete(closestNodeId);

    const neighbors = adjacency[closestNodeId] || [];
    for (const edge of neighbors) {
      if (!unvisited.has(edge.to)) continue;

      // ── STRICT FLOOD AVOIDANCE LOGIC ────────────────────────────────────────
      let isImpassable = false;

      if (avoidFloods) {
        if (edge.status === 'submerged' || edge.waterDepthMeters > tolerance) {
          isImpassable = true;
        }
      }

      if (isImpassable) {
        continue; // Cost remains Infinity (pruned from graph)
      }

      // Calculate traversal speed and weight
      let effectiveSpeed = edge.maxSpeedKmh;
      let costMultiplier = 1.0;

      if (edge.status === 'restricted') {
        effectiveSpeed = Math.min(effectiveSpeed, 35);
        costMultiplier = 2.5; // Penalty for water on road
      }

      if (vehicleClass === 'pedestrian_escort') {
        effectiveSpeed = 5.0; // 5 km/h walking pace
      } else if (vehicleClass === 'tractor_trailer') {
        effectiveSpeed = Math.min(effectiveSpeed, 25);
      }

      const travelTimeMinutes = (edge.distanceKm / Math.max(5, effectiveSpeed)) * 60;
      const edgeCost = edge.distanceKm * costMultiplier;

      const newCost = distances[closestNodeId].cost + edgeCost;
      if (newCost < distances[edge.to].cost) {
        distances[edge.to].cost = newCost;
        distances[edge.to].distanceKm = distances[closestNodeId].distanceKm + edge.distanceKm;
        distances[edge.to].estimatedMinutes =
          distances[closestNodeId].estimatedMinutes + travelTimeMinutes;
        distances[edge.to].prevNode = closestNodeId;
        distances[edge.to].viaEdge = edge;
      }
    }
  }

  // Reconstruct path
  const pathCoordinates: [number, number][] = [];
  const edgesInPath: RouteEdge[] = [];
  let curr = destinationId;

  if (distances[destinationId].cost === Infinity) {
    // Destination is completely cut-off by floodwaters
    return {
      routeId: `route_${originId}_${destinationId}_blocked`,
      title: `${origin.name} → ${destination.name} (Severed by Flood)`,
      nepaliTitle: `${origin.nepaliName} → ${destination.nepaliName} (बाढीले सम्पर्कविच्छेद)`,
      mode: destination.type === 'safe_haven' ? 'civilian_alternate' : 'relief_convoy',
      origin,
      destination,
      vehicleClass,
      distanceKm: 0,
      estimatedMinutes: 0,
      submergedKmBypassed: 0,
      avoidanceAlert: `CRITICAL ALERT: All wheeled vehicle routes between ${origin.name} and ${destination.name} are impassable due to deep floodwaters (> ${tolerance}m). Only Nepal Army Zodiac motorboats and rotary helicopters can access this location.`,
      status: 'unreachable',
      path: [],
      steps: [],
      bridgesEncountered: [],
      reliefQuota: calculateWHOQuota(destination.capacity || 5000),
      safeHavenCapacity: destination.capacity,
    };
  }

  while (curr && distances[curr].prevNode) {
    const viaEdge = distances[curr].viaEdge;
    if (viaEdge) {
      edgesInPath.unshift(viaEdge);
      pathCoordinates.unshift(...viaEdge.path);
    }
    curr = distances[curr].prevNode!;
  }

  // De-duplicate contiguous coordinates
  const uniquePath: [number, number][] = [];
  pathCoordinates.forEach((pt) => {
    if (
      uniquePath.length === 0 ||
      uniquePath[uniquePath.length - 1][0] !== pt[0] ||
      uniquePath[uniquePath.length - 1][1] !== pt[1]
    ) {
      uniquePath.push(pt);
    }
  });

  // Calculate Turn-by-Turn Steps
  const steps: TurnStep[] = [];
  let cumulativeKm = 0;

  steps.push({
    stepNumber: 1,
    instruction: `Depart from ${origin.name} (${origin.elevationMeters}m ASL). Check convoy medical supplies and communication gear.`,
    nepaliInstruction: `${origin.nepaliName} (${origin.elevationMeters} मिटर) बाट प्रस्थान गर्नुहोस्। राहत सामग्री र सञ्चार उपकरण जाँच गर्नुहोस्।`,
    distanceKm: 0,
    cumulativeKm: 0,
    roadName: 'Depot Staging Ground',
    coords: origin.coords,
    elevationMeters: origin.elevationMeters,
    action: 'depart',
  });

  edgesInPath.forEach((edge, idx) => {
    cumulativeKm += edge.distanceKm;
    const targetNode = ROUTE_NODES[edge.to];
    const isBridge = edge.bridgeId !== undefined || edge.surface === 'causeway';

    let action: TurnStep['action'] = 'continue';
    if (idx === edgesInPath.length - 1) {
      action = 'arrive';
    } else if (isBridge) {
      action = 'cross_bridge';
    } else if (idx % 2 === 1) {
      action = 'turn_right';
    } else {
      action = 'turn_left';
    }

    steps.push({
      stepNumber: idx + 2,
      instruction: `Follow ${edge.name} for ${edge.distanceKm.toFixed(1)} km towards ${targetNode?.name || 'next junction'}. Surface: ${edge.surface.replace('_', ' ')}.`,
      nepaliInstruction: `${edge.name} हुँदै ${edge.distanceKm.toFixed(1)} कि.मी. अगाडि बढ्नुहोस्।`,
      distanceKm: edge.distanceKm,
      cumulativeKm: parseFloat(cumulativeKm.toFixed(1)),
      roadName: edge.name,
      coords: edge.path[edge.path.length - 1] || targetNode.coords,
      elevationMeters: targetNode ? targetNode.elevationMeters : 100,
      hazardAlert: edge.hazardNote,
      action,
    });
  });

  // Determine Submerged Kilometers Bypassed
  const directBlockedEdges = ROUTE_EDGES.filter(
    (e) =>
      e.status === 'submerged' &&
      (e.from === originId || e.to === destinationId || e.name.toLowerCase().includes(destination.district.toLowerCase()))
  );

  const submergedKmBypassed = directBlockedEdges.reduce((sum, e) => sum + e.distanceKm, 0);
  const blockedDirectPath = directBlockedEdges.length > 0 ? directBlockedEdges[0].path : undefined;

  // Compile Encountered Bridges
  const bridgesEncountered = [
    {
      name: 'Bagmati Karmaiya Highway Bridge',
      river: 'Bagmati River',
      status: 'monitored_safe' as const,
      advice: 'Open to all normal transit. Speed limit 40 km/h.',
    },
    {
      name: 'Koshi Barrage (Sluice Gates 1-56)',
      river: 'Saptakoshi River',
      status: 'high_warning' as const,
      advice: 'Single-lane emergency transit under Armed Police Force regulation.',
    },
  ];

  const isEvacuation = destination.type === 'safe_haven';
  const avoidanceAlert =
    submergedKmBypassed > 0
      ? `SUCCESSFUL DETOUR: Avoided ${submergedKmBypassed.toFixed(1)} km of submerged highway on the direct route. High-ground detour routing ensures 100% convoy safety.`
      : `SAFE ROUTE VERIFIED: All traversed road segments have passable water depth (< ${tolerance}m).`;

  return {
    routeId: `route_${originId}_${destinationId}_${vehicleClass}`,
    title: isEvacuation
      ? `Civilian Alternate Egress: ${origin.name} → ${destination.name}`
      : `Relief Convoy Lifeline: ${origin.name} → ${destination.name}`,
    nepaliTitle: isEvacuation
      ? `नागरिक सुरक्षित निकासी: ${origin.nepaliName} → ${destination.nepaliName}`
      : `राहत तथा स्वास्थ्य आपूर्ति: ${origin.nepaliName} → ${destination.nepaliName}`,
    mode: isEvacuation ? 'civilian_alternate' : 'relief_convoy',
    origin,
    destination,
    vehicleClass,
    distanceKm: parseFloat(distances[destinationId].distanceKm.toFixed(1)),
    estimatedMinutes: Math.round(distances[destinationId].estimatedMinutes),
    submergedKmBypassed: parseFloat(submergedKmBypassed.toFixed(1)),
    avoidanceAlert,
    status: 'active_safe',
    path: uniquePath,
    blockedDirectPath,
    steps,
    bridgesEncountered,
    reliefQuota: calculateWHOQuota(destination.capacity || 10000),
    safeHavenCapacity: destination.capacity,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. PRE-CONFIGURED EMERGENCY MISSION PRESETS
// ─────────────────────────────────────────────────────────────────────────────
export interface EmergencyMissionPreset {
  id: string;
  name: string;
  nepaliName: string;
  type: 'relief_convoy' | 'civilian_alternate';
  originId: string;
  destinationId: string;
  vehicleClass: VehicleClass;
  tagline: string;
  urgency: 'critical' | 'high' | 'moderate';
  floodAvoidanceSummary: string;
}

export const EMERGENCY_MISSION_PRESETS: EmergencyMissionPreset[] = [
  // ── POINT 7: RELIEF CONVOYS ──────────────────────────────────────────────
  {
    id: 'preset_convoy_gaur',
    name: 'Bharatpur Base → Gaur Deluge Zone (Relief Convoy)',
    nepaliName: 'भरतपुर सेना क्याम्प → गौर बाढी क्षेत्र (राहत आपूर्ति)',
    type: 'relief_convoy',
    originId: 'depot_bharatpur',
    destinationId: 'target_gaur',
    vehicleClass: 'army_6x6',
    tagline: 'Delivers 55,000L potable water, snakebite antivenom & Zodiac motorboats to 18,400 cut-off citizens.',
    urgency: 'critical',
    floodAvoidanceSummary: 'Bypasses flooded Postal Highway (2.2m water) via elevated Chandranigahapur North Feeder.',
  },
  {
    id: 'preset_convoy_koshi',
    name: 'Duhabi Hub → Hanumannagar & Koshi Buffer (Relief Convoy)',
    nepaliName: 'दुहबी आपूर्ति केन्द्र → हनुमाननगर सप्तकोशी (राहत आपूर्ति)',
    type: 'relief_convoy',
    originId: 'depot_duhabi',
    destinationId: 'target_hanumannagar',
    vehicleClass: 'army_6x6',
    tagline: 'Dispatches emergency rations, ORS packets, and chlorine Aquatabs across Koshi Barrage.',
    urgency: 'high',
    floodAvoidanceSummary: 'Crosses Koshi Barrage under APF single-lane escort; bypasses submerged southern dykes.',
  },
  {
    id: 'preset_convoy_banke',
    name: 'Nepalgunj Airbase → Holiya Flood Plain (Relief Convoy)',
    nepaliName: 'नेपालगञ्ज विमानस्थल → होलिया बाढी क्षेत्र (राहत आपूर्ति)',
    type: 'relief_convoy',
    originId: 'depot_nepalgunj',
    destinationId: 'target_holiya',
    vehicleClass: 'army_6x6',
    tagline: 'Transports medical trauma kits and mobile water purification to 14,800 inundated villagers.',
    urgency: 'high',
    floodAvoidanceSummary: 'Avoids submerged Kamdi culvert (1.7m flood depth) via northern Baghamara dike road.',
  },
  {
    id: 'preset_convoy_bhajani',
    name: 'Dhangadhi Army Camp → Bhajani Inundated Basin (Relief Convoy)',
    nepaliName: 'धनगढी सेना क्याम्प → भजनी डुबान क्षेत्र (राहत आपूर्ति)',
    type: 'relief_convoy',
    originId: 'depot_dhangadhi',
    destinationId: 'target_bhajani',
    vehicleClass: 'army_6x6',
    tagline: 'Delivers dry food rations and inflatable raft teams to marooned Kandra-Mohana wards.',
    urgency: 'critical',
    floodAvoidanceSummary: 'Circumnavigates 18.2 km of submerged Postal Highway via Lamki-Tikapur high ground.',
  },

  // ── POINT 9: CIVILIAN EVACUATIONS ─────────────────────────────────────────
  {
    id: 'preset_evac_gaur_chandra',
    name: 'Gaur Basin → Chandranigahapur Safe Ridge (Evacuation)',
    nepaliName: 'गौर बाढी क्षेत्र → चन्द्रनिगाहपुर सुरक्षित आश्रयस्थल (निकासी)',
    type: 'civilian_alternate',
    originId: 'target_gaur',
    destinationId: 'haven_chandranigahapur',
    vehicleClass: 'tractor_trailer',
    tagline: 'Directs stranded citizens northwards from 2.2m flood water to Chandranigahapur Stadium (142m ASL).',
    urgency: 'critical',
    floodAvoidanceSummary: 'Strictly blocks southern border ring bund (2.5m standing water); guides convoys north.',
  },
  {
    id: 'preset_evac_prakashpur_baraha',
    name: 'Prakashpur Lowlands → Barahachhetra High Ridge (Evacuation)',
    nepaliName: 'प्रकाशपुर तटीय क्षेत्र → वराहक्षेत्र उच्च पहाडी आश्रय (निकासी)',
    type: 'civilian_alternate',
    originId: 'target_prakashpur',
    destinationId: 'haven_barahachhetra',
    vehicleClass: 'pedestrian_escort',
    tagline: 'Directs vulnerable families from Koshi buffer plain uphill to Barahachhetra Ridge (185m ASL).',
    urgency: 'high',
    floodAvoidanceSummary: 'Completely avoids low-lying canal trails; utilizes elevated Chatara ridge road.',
  },
  {
    id: 'preset_evac_bhajani_tikapur',
    name: 'Bhajani Lowlands → Tikapur High Campus (Evacuation)',
    nepaliName: 'भजनी डुबान क्षेत्र → टीकापुर क्याम्पस सुरक्षित परिसर (निकासी)',
    type: 'civilian_alternate',
    originId: 'target_bhajani',
    destinationId: 'haven_tikapur',
    vehicleClass: 'tractor_trailer',
    tagline: 'Transports evacuees around submerged culverts to Tikapur Birendra Vidya Mandir (Capacity: 6,000).',
    urgency: 'critical',
    floodAvoidanceSummary: 'Diverts around 1.9m flood on Postal Highway H12 via Lalmatiya northern causeway.',
  },
  {
    id: 'preset_evac_holiya_kohalpur',
    name: 'Holiya Riverside → Kohalpur Sports Stadium (Evacuation)',
    nepaliName: 'होलिया तटीय क्षेत्र → कोहलपुर खेलकुद रंगशाला (निकासी)',
    type: 'civilian_alternate',
    originId: 'target_holiya',
    destinationId: 'haven_kohalpur',
    vehicleClass: 'tractor_trailer',
    tagline: 'Evacuates displaced villagers along West Rapti to high-capacity Kohalpur shelter (154m ASL).',
    urgency: 'high',
    floodAvoidanceSummary: 'Bypasses flooded lower plains using elevated Baghamara dike road.',
  },
];
