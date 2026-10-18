/**
 * teraiEmergencyRoutes.ts — Emergency Relief Convoy & Civilian Alternate Egress Routes for Nepal Terai.
 *
 * Implements:
 * 1. Relief & Medical Supply Convoys (bypassing flood breaches from major military/relief hubs).
 * 2. Civilian Alternate Routes (evacuating stranded populations to elevated safe havens).
 */

export interface RouteCheckpoint {
  name: string;
  coords: [number, number];
  status: 'clear' | 'caution' | 'staging_post';
  note: string;
}

export interface EmergencyRoute {
  id: string;
  name: string;
  nepaliName: string;
  type: 'relief_convoy' | 'civilian_alternate';
  origin: string;
  destination: string;
  district: string;
  distanceKm: number;
  estimatedMinutes: number;
  color: string; // Neon Green/Cyan for Relief, Amber/Orange for Alternate
  status: 'active_safe' | 'caution_high_clearance';
  statusDescription: string;
  vehicleRecommendation: string;
  checkpoints: RouteCheckpoint[];
  path: [number, number][]; // [lat, lng][]
  hazardWarnings: string[];
}

export const EMERGENCY_ROUTES: EmergencyRoute[] = [
  // ─────────────────────────────────────────────────────────────────────────────
  // 1. RELIEF & MEDICAL CONVOY ROUTES
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'route_relief_gaur',
    name: 'Central Terai Lifeline: Bharatpur Staging Hub → Gaur Deluge Zone',
    nepaliName: 'भरतपुर सेना क्याम्प → गौर बाढीग्रस्त क्षेत्र राहत मार्ग',
    type: 'relief_convoy',
    origin: 'Bharatpur Army Cantonment & Regional Depot',
    destination: 'Gaur Submerged District Headquarters',
    district: 'Rautahat / Chitwan',
    distanceKm: 98.4,
    estimatedMinutes: 135,
    color: '#10B981', // Neon Emerald Green
    status: 'active_safe',
    statusDescription: 'Elevated North Feeder Canal Road clear of Bagmati backwater.',
    vehicleRecommendation: 'Army 6x6 Heavy Trucks & Zodiac Inflatable Boat Transporters',
    hazardWarnings: [
      'Postal Highway directly south of Gaur is impassable (2.4m water). Diversion via Chandranigahapur mandatory.',
      'Maintain slow speed at Bagmati Bridge approach due to debris.',
    ],
    checkpoints: [
      {
        name: 'Bharatpur Army Logistics Hub',
        coords: [27.68, 84.43],
        status: 'staging_post',
        note: 'Primary staging warehouse for medical supplies & inflatable boats.',
      },
      {
        name: 'Hetauda Bypass Junction',
        coords: [27.42, 85.03],
        status: 'clear',
        note: 'Elevated highway crossing; zero water accumulation.',
      },
      {
        name: 'Chandranigahapur Staging Base',
        coords: [27.12, 85.34],
        status: 'staging_post',
        note: 'Switch to high-clearance military vehicles and rescue boats.',
      },
      {
        name: 'Pipra Rajdevi High Causeway',
        coords: [26.85, 85.30],
        status: 'caution',
        note: 'Water 0.3m over culvert; tractor and army trucks only.',
      },
      {
        name: 'Gaur Flood Relief Point',
        coords: [26.76, 85.28],
        status: 'caution',
        note: 'Terminal delivery point; boat dispatch to marooned wards 1-4.',
      },
    ],
    path: [
      [27.68, 84.43],
      [27.65, 84.58],
      [27.60, 84.75],
      [27.50, 84.90],
      [27.42, 85.03],
      [27.35, 85.12],
      [27.28, 85.22],
      [27.12, 85.34],
      [27.02, 85.32],
      [26.92, 85.31],
      [26.85, 85.30],
      [26.79, 85.29],
      [26.76, 85.28],
    ],
  },
  {
    id: 'route_relief_koshi',
    name: 'Eastern Terai Lifeline: Duhabi Depot → Koshi & Hanumannagar Cut-Offs',
    nepaliName: 'दुहबी खाद्यान्न डिपो → सप्तकोशी तथा हनुमाननगर राहत करिडोर',
    type: 'relief_convoy',
    origin: 'Duhabi Emergency Logistics Hub, Sunsari',
    destination: 'Hanumannagar Kankalini / Saptakoshi Embankment',
    district: 'Sunsari / Saptari',
    distanceKm: 68.2,
    estimatedMinutes: 95,
    color: '#06B6D4', // Luminous Cyan
    status: 'active_safe',
    statusDescription: 'East-West Highway H01 to Koshi Barrage open under armed escort.',
    vehicleRecommendation: 'High-clearance medical vans, water filtration bowsers, APF trucks',
    hazardWarnings: [
      'Koshi Barrage sluice gate spray creates low visibility.',
      'Do not take southern embankment spur towards Bhantabari without pilot vehicle.',
    ],
    checkpoints: [
      {
        name: 'Duhabi Warehouse Staging',
        coords: [26.57, 87.28],
        status: 'staging_post',
        note: 'Nepal Red Cross regional food and hygiene kit stockpile.',
      },
      {
        name: 'Inaruwa High Junction',
        coords: [26.60, 87.15],
        status: 'clear',
        note: 'Highway dry; police checkpoint managing emergency convoys.',
      },
      {
        name: 'Koshi Barrage Crossing (Sluice 1-56)',
        coords: [26.52, 86.92],
        status: 'caution',
        note: 'Traffic restricted to emergency vehicles only. High current below.',
      },
      {
        name: 'Hanumannagar Emergency Drop Zone',
        coords: [26.54, 86.85],
        status: 'staging_post',
        note: 'Unload rations to motorboats for marooned island wards.',
      },
    ],
    path: [
      [26.57, 87.28],
      [26.58, 87.22],
      [26.60, 87.15],
      [26.59, 87.05],
      [26.56, 86.98],
      [26.52, 86.92],
      [26.53, 86.88],
      [26.54, 86.85],
    ],
  },
  {
    id: 'route_relief_banke',
    name: 'Western Terai Lifeline: Nepalgunj Airbase → Holiya & Narainapur',
    nepaliName: 'नेपालगञ्ज विमानस्थल डिपो → होलिया र नरैनापुर बाढी क्षेत्र',
    type: 'relief_convoy',
    origin: 'Nepalgunj Airport Emergency Staging Ground',
    destination: 'Holiya & Betahani Inundated Riverside Wards',
    district: 'Banke',
    distanceKm: 41.5,
    estimatedMinutes: 65,
    color: '#10B981', // Neon Green
    status: 'active_safe',
    statusDescription: 'Elevated Kohalpur-Baghamara northern spur bypasses West Rapti backwater.',
    vehicleRecommendation: 'Nepal Army 4x4 troop carriers and amphibious boats',
    hazardWarnings: [
      'Direct southern road cut off by 1.8m inundation at Kamdi culvert.',
      'Northern elevated dike road width is single-lane; convoy priority.',
    ],
    checkpoints: [
      {
        name: 'Nepalgunj Airbase Depot',
        coords: [28.10, 81.67],
        status: 'staging_post',
        note: 'Rotary air-drop staging and medical cargo warehouse.',
      },
      {
        name: 'Fattepur Elevated High Spur',
        coords: [28.05, 81.76],
        status: 'clear',
        note: 'High-ground staging station; clean drinking water refill.',
      },
      {
        name: 'Holiya Ward 2 Relief Camp',
        coords: [27.95, 81.82],
        status: 'caution',
        note: 'Terminal delivery point; boat access across submerged paddy fields.',
      },
    ],
    path: [
      [28.10, 81.67],
      [28.12, 81.72],
      [28.08, 81.75],
      [28.05, 81.76],
      [28.00, 81.79],
      [27.95, 81.82],
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. CIVILIAN ALTERNATE EVACUATION ROUTES
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'route_alt_gaur',
    name: 'Civilian Alternate Egress: Gaur Submerged Ring → Chandranigahapur Safe Ridge',
    nepaliName: 'गौर बाढीग्रस्त क्षेत्रबाट चन्द्रनिगाहपुर सुरक्षित उच्च स्थलतर्फ वैकल्पिक मार्ग',
    type: 'civilian_alternate',
    origin: 'Gaur Flood Basin (Water Depth >2.2m)',
    destination: 'Chandranigahapur Elevated Public Campus & Stadium Shelter',
    district: 'Rautahat',
    distanceKm: 42.0,
    estimatedMinutes: 60,
    color: '#F59E0B', // Amber / Orange
    status: 'active_safe',
    statusDescription: 'Northbound Gaur-Chandranigahapur highway is completely dry and elevated.',
    vehicleRecommendation: 'Civilian buses, tractors, motorcycles, and walking groups',
    hazardWarnings: [
      'DO NOT head south toward Indian border ring bund (blocked by 2.5m standing water).',
      'Follow police guide ribbons along the northern embankment.',
    ],
    checkpoints: [
      {
        name: 'Gaur Bhanu Chowk Assembly Point',
        coords: [26.77, 85.28],
        status: 'caution',
        note: 'Evacuee boat pickup and tractor embarkation zone.',
      },
      {
        name: 'Pipra High Terrace',
        coords: [26.86, 85.30],
        status: 'clear',
        note: 'Water drops to zero; dry paved highway begins.',
      },
      {
        name: 'Garuda Municipality Center',
        coords: [26.98, 85.31],
        status: 'clear',
        note: 'Water, food distribution, and medical triage station.',
      },
      {
        name: 'Chandranigahapur High Shelter',
        coords: [27.12, 85.34],
        status: 'staging_post',
        note: 'Capacity: 7,500 evacuees; Red Cross camp setup with dry halls.',
      },
    ],
    path: [
      [26.77, 85.28],
      [26.82, 85.29],
      [26.86, 85.30],
      [26.92, 85.31],
      [26.98, 85.31],
      [27.05, 85.33],
      [27.12, 85.34],
    ],
  },
  {
    id: 'route_alt_koshi',
    name: 'Civilian Alternate Egress: Prakashpur Lowlands → Barahachhetra High Ridge',
    nepaliName: 'प्रकाशपुर तटीय क्षेत्रबाट वराहक्षेत्र सुरक्षित उच्च पहाडी स्थलतर्फ वैकल्पिक मार्ग',
    type: 'civilian_alternate',
    origin: 'Prakashpur Submerged Lowlands (Sunsari)',
    destination: 'Barahachhetra High Ridge Relief Haven (185m ASL)',
    district: 'Sunsari',
    distanceKm: 18.5,
    estimatedMinutes: 35,
    color: '#F97316', // Luminous Orange
    status: 'active_safe',
    statusDescription: 'Direct uphill evacuation corridor away from Koshi eastern breach.',
    vehicleRecommendation: 'Walking with relief guides, tractor trailers, 4x4 pickups',
    hazardWarnings: [
      'Avoid lower river trail along Chatara canal; use upper ridge road.',
    ],
    checkpoints: [
      {
        name: 'Prakashpur Ward 4 Evacuation Point',
        coords: [26.74, 87.05],
        status: 'caution',
        note: 'Assemble families on school roof; board evacuation tractors.',
      },
      {
        name: 'Chatara Foothill Staging',
        coords: [26.82, 87.15],
        status: 'clear',
        note: 'Elevation rises past 120m ASL; out of flood zone.',
      },
      {
        name: 'Barahachhetra High Ridge Camp',
        coords: [26.89, 87.17],
        status: 'staging_post',
        note: 'Capacity: 8,500 persons; helicopter landing zone (HLZ) active.',
      },
    ],
    path: [
      [26.74, 87.05],
      [26.78, 87.10],
      [26.82, 87.15],
      [26.86, 87.16],
      [26.89, 87.17],
    ],
  },
  {
    id: 'route_alt_bhajani',
    name: 'Civilian Alternate Egress: Bhajani / Mohana Basin → Tikapur High Campus',
    nepaliName: 'भजनी तथा मोहना नदी डुबान क्षेत्रबाट टीकापुर क्याम्पसतर्फ सुरक्षित मार्ग',
    type: 'civilian_alternate',
    origin: 'Bhajani Municipality Lowlands (Kailali)',
    destination: 'Tikapur Birendra Vidya Mandir High Ground Compound',
    district: 'Kailali',
    distanceKm: 26.0,
    estimatedMinutes: 45,
    color: '#F59E0B',
    status: 'active_safe',
    statusDescription: 'Northern diversion around submerged Postal Highway section.',
    vehicleRecommendation: 'Tractors, pickup trucks, police escort buses',
    hazardWarnings: [
      'Postal highway cut-off between km 12 and km 22; do not attempt southern route.',
    ],
    checkpoints: [
      {
        name: 'Bhajani Ward 3 Ward Office',
        coords: [28.45, 81.12],
        status: 'caution',
        note: 'Water 1.4m deep; evacuate north immediately.',
      },
      {
        name: 'Lalmatiya High Causeway',
        coords: [28.52, 81.18],
        status: 'clear',
        note: 'Dry elevated road connection.',
      },
      {
        name: 'Tikapur High Campus Refuge',
        coords: [28.52, 81.13],
        status: 'staging_post',
        note: 'Capacity: 6,000 citizens; full Red Cross camp operational.',
      },
    ],
    path: [
      [28.45, 81.12],
      [28.48, 81.15],
      [28.52, 81.18],
      [28.52, 81.13],
    ],
  },
];
