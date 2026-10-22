/**
 * teraiReliefRoutes.ts — Relief Support, Alternate Travel, and Helicopter Air Support Routes.
 *
 * Implements User Requirements 4, 5, and 8:
 * 4. "make a route for relief support for flooded village and cities or towns"
 * 5. "make a alternate route for people who travel at that route"
 * 8. "plan a route for air support like helicopter for relief support based on current weather support"
 *
 * Data Structure:
 * - Ground Relief Convoy Routes: Optimal paths from staging depots to flooded settlements via passable roads.
 * - Alternate Travel Routes: Bypass corridors for civilian travelers when primary highways are submerged.
 * - Helicopter Air Support Sorties: Flight paths from Nepal Army heliports to safe haven HLZs near flooded zones.
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. GROUND RELIEF CONVOY ROUTES
// ─────────────────────────────────────────────────────────────────────────────

export interface ReliefConvoyRoute {
  id: string;
  name: string;
  nepaliName: string;
  sectorId: string;                 // Links to TERAI_RIVER_SECTORS key
  routeType: 'primary_relief' | 'secondary_relief';
  origin: string;                   // Staging depot / base
  destination: string;              // Target flooded settlement cluster
  totalDistanceKm: number;
  estimatedTimeMins: number;
  convoyType: 'army_6x6_trucks' | 'nrcs_ambulance_convoy' | 'heavy_tractor_boats';
  payloadCapacity: string;
  status: 'active_clear' | 'partially_blocked' | 'requires_escort';
  roadCondition: string;
  waypoints: string[];              // Named waypoints along the route
  path: [number, number][];         // [lat, lng][] for map rendering
  color: string;
  notes: string;
}

export const RELIEF_CONVOY_ROUTES: ReliefConvoyRoute[] = [
  // ── KOSHI SECTOR RELIEF ROUTES ────────────────────────────────────────────
  {
    id: 'relief_koshi_primary_01',
    name: 'Biratnagar Depot → Koshi Barrage → Haripur Relief Corridor',
    nepaliName: 'विराटनगर डिपो → कोशी ब्यारेज → हरिपुर राहत मार्ग',
    sectorId: 'koshi_sector',
    routeType: 'primary_relief',
    origin: 'Biratnagar Regional Supply Depot (Nepal Army)',
    destination: 'Haripur & Rajbiraj Flood Zone',
    totalDistanceKm: 52.4,
    estimatedTimeMins: 95,
    convoyType: 'army_6x6_trucks',
    payloadCapacity: '40 tons (8 trucks × 5 tons)',
    status: 'active_clear',
    roadCondition: 'H01 Mahendra Highway passable with restricted segments near Koshi Barrage',
    waypoints: ['Biratnagar Depot', 'Inaruwa Junction', 'Koshi Barrage Checkpoint', 'Rajbiraj Town', 'Haripur VDC'],
    path: [
      [26.4534, 87.2718],  // Biratnagar
      [26.5824, 87.1345],  // Inaruwa
      [26.6542, 87.0458],  // Koshi Barrage
      [26.5395, 86.7450],  // Rajbiraj
      [26.5912, 86.8124],  // Haripur
    ],
    color: '#22C55E',
    notes: 'Primary Nepal Army supply corridor. 6×6 trucks staged at Biratnagar cantonment. Road escort by APF at Koshi Barrage crossing.',
  },
  {
    id: 'relief_koshi_secondary_01',
    name: 'Dharan → Chatara Bridge → Sunsari South Relief Line',
    nepaliName: 'धरान → चतरा पुल → सुनसरी दक्षिण राहत मार्ग',
    sectorId: 'koshi_sector',
    routeType: 'secondary_relief',
    origin: 'Dharan Nepal Red Cross Regional HQ',
    destination: 'Sunsari South Flood-Affected Villages',
    totalDistanceKm: 38.7,
    estimatedTimeMins: 75,
    convoyType: 'nrcs_ambulance_convoy',
    payloadCapacity: '15 tons medical + food (6 ambulances + 4 supply vans)',
    status: 'partially_blocked',
    roadCondition: 'F01 Feeder road partially waterlogged south of Chatara; high-clearance required',
    waypoints: ['Dharan NRCS HQ', 'Chatara Suspension Bridge', 'Barahachhetra', 'Prakashpur', 'Laukahi VDC'],
    path: [
      [26.8121, 87.2836],  // Dharan
      [26.8645, 87.1642],  // Chatara
      [26.8924, 87.1724],  // Barahachhetra
      [26.7312, 87.1456],  // Prakashpur
      [26.6234, 87.0812],  // Laukahi
    ],
    color: '#F59E0B',
    notes: 'Secondary NRCS ambulance convoy via elevated Chatara bypass. Last 8km requires high-clearance escort.',
  },
  {
    id: 'relief_koshi_boat_01',
    name: 'Koshi Barrage → Rampur Malhaniya Boat Relief',
    nepaliName: 'कोशी ब्यारेज → रामपुर मल्हनिया नाव राहत',
    sectorId: 'koshi_sector',
    routeType: 'secondary_relief',
    origin: 'Koshi Barrage East Embankment Staging',
    destination: 'Rampur Malhaniya & Isolated Tole Clusters',
    totalDistanceKm: 18.5,
    estimatedTimeMins: 120,
    convoyType: 'heavy_tractor_boats',
    payloadCapacity: '8 tons (4 motorized country boats + 2 tractors)',
    status: 'requires_escort',
    roadCondition: 'Road submerged; water-only access via Koshi floodplain',
    waypoints: ['Koshi Barrage Gate 56', 'Eastern Embankment Ramp', 'Flood Channel Crossing', 'Rampur Malhaniya Island'],
    path: [
      [26.6542, 87.0458],  // Koshi Barrage
      [26.6312, 87.0234],  // Embankment ramp
      [26.5845, 86.9912],  // Flood channel
      [26.5534, 86.9645],  // Rampur Malhaniya
    ],
    color: '#EF4444',
    notes: 'Critical boat-only relief. Nepal Army engineers deployed with motorized country boats. Escort mandatory due to strong current.',
  },

  // ── NARAYANI SECTOR RELIEF ROUTES ─────────────────────────────────────────
  {
    id: 'relief_narayani_primary_01',
    name: 'Bharatpur Depot → Nawalparasi → Gaindakot Relief Corridor',
    nepaliName: 'भरतपुर डिपो → नवलपरासी → गैंडाकोट राहत मार्ग',
    sectorId: 'narayani_sector',
    routeType: 'primary_relief',
    origin: 'Bharatpur Army Cantonment Supply Base',
    destination: 'Gaindakot & Devchuli Flood Zone',
    totalDistanceKm: 68.2,
    estimatedTimeMins: 110,
    convoyType: 'army_6x6_trucks',
    payloadCapacity: '50 tons (10 trucks × 5 tons)',
    status: 'active_clear',
    roadCondition: 'H01 Mahendra Highway clear to Nawalparasi; restricted at Narayani bridge approach',
    waypoints: ['Bharatpur Base', 'Dumkibas', 'Kawasoti', 'Nawalparasi Town', 'Gaindakot'],
    path: [
      [27.6767, 84.4322],  // Bharatpur
      [27.6234, 84.2812],  // Dumkibas
      [27.6024, 83.9645],  // Kawasoti
      [27.5812, 83.6534],  // Nawalparasi
      [27.6345, 84.4085],  // Gaindakot
    ],
    color: '#22C55E',
    notes: 'Primary Army relief corridor for Narayani basin. Bridge clearance confirmed at Devghat.',
  },
  {
    id: 'relief_narayani_secondary_01',
    name: 'Birgunj → Parsa → Rautahat South Relief',
    nepaliName: 'वीरगञ्ज → पर्सा → रौतहट दक्षिण राहत',
    sectorId: 'narayani_sector',
    routeType: 'secondary_relief',
    origin: 'Birgunj NRCS Distribution Center',
    destination: 'Rautahat Southern Flood Zone',
    totalDistanceKm: 44.6,
    estimatedTimeMins: 85,
    convoyType: 'nrcs_ambulance_convoy',
    payloadCapacity: '20 tons (8 supply trucks)',
    status: 'partially_blocked',
    roadCondition: 'H12 Postal Highway restricted south of Parsa; detour via Simara required',
    waypoints: ['Birgunj NRCS', 'Simara Airport', 'Jeetpur Simara', 'Chandranigahapur', 'Gaur'],
    path: [
      [27.0145, 84.8767],  // Birgunj
      [27.1624, 84.9812],  // Simara
      [27.2045, 84.8534],  // Jeetpur
      [27.0234, 85.3045],  // Chandranigahapur
      [26.7634, 85.2812],  // Gaur
    ],
    color: '#F59E0B',
    notes: 'NRCS-led convoy via Simara bypass. Parsa Wildlife Buffer Zone road usable for heavy vehicles.',
  },

  // ── KARNALI SECTOR RELIEF ROUTES ──────────────────────────────────────────
  {
    id: 'relief_karnali_primary_01',
    name: 'Dhangadhi Depot → Tikapur → Rajapur Relief Corridor',
    nepaliName: 'धनगढी डिपो → टीकापुर → राजापुर राहत मार्ग',
    sectorId: 'karnali_sector',
    routeType: 'primary_relief',
    origin: 'Dhangadhi Army Regional Base',
    destination: 'Rajapur & Bardiya Flood Zone',
    totalDistanceKm: 56.8,
    estimatedTimeMins: 100,
    convoyType: 'army_6x6_trucks',
    payloadCapacity: '45 tons (9 trucks × 5 tons)',
    status: 'active_clear',
    roadCondition: 'H01 clear to Tikapur; F05 feeder restricted near Karnali River approach',
    waypoints: ['Dhangadhi Base', 'Attariya', 'Tikapur Town', 'Karnali Bridge', 'Rajapur Island'],
    path: [
      [28.6956, 80.5945],  // Dhangadhi
      [28.7712, 80.5434],  // Attariya
      [28.5245, 81.1234],  // Tikapur
      [28.4812, 81.2345],  // Karnali Bridge
      [28.3534, 81.2912],  // Rajapur
    ],
    color: '#22C55E',
    notes: 'Primary relief for Karnali island communities. Army engineers maintaining pontoon bridge at Chisapani.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 2. ALTERNATE TRAVEL ROUTES (CIVILIAN BYPASS)
// ─────────────────────────────────────────────────────────────────────────────

export interface AlternateRoute {
  id: string;
  name: string;
  nepaliName: string;
  sectorId: string;
  blockedRoad: string;              // Which primary road is blocked
  blockedSegment: string;           // Specific segment that's flooded
  bypassName: string;
  bypassDistanceKm: number;
  extraTimeMins: number;            // Additional travel time vs normal route
  suitableFor: ('cars' | 'motorcycles' | 'buses' | 'trucks')[];
  roadSurface: 'paved_asphalt' | 'gravel_metalled' | 'earthen_track';
  safetyRating: 'safe' | 'moderate_caution' | 'high_risk';
  status: 'recommended' | 'available' | 'emergency_only';
  waypoints: string[];
  path: [number, number][];
  color: string;
  advisoryNote: string;
}

export const ALTERNATE_ROUTES: AlternateRoute[] = [
  // ── KOSHI SECTOR ALTERNATE ROUTES ─────────────────────────────────────────
  {
    id: 'alt_koshi_01',
    name: 'Koshi Barrage Bypass via Chatara-Inaruwa Elevated Road',
    nepaliName: 'कोशी ब्यारेज बाइपास: चतरा-इनरुवा उच्च मार्ग',
    sectorId: 'koshi_sector',
    blockedRoad: 'H01 Mahendra Highway',
    blockedSegment: 'Bhantabari → Koshi Barrage → Kanchanpur (4.2km submerged)',
    bypassName: 'Chatara-Inaruwa Elevated Bypass',
    bypassDistanceKm: 42.5,
    extraTimeMins: 35,
    suitableFor: ['cars', 'motorcycles', 'buses'],
    roadSurface: 'paved_asphalt',
    safetyRating: 'safe',
    status: 'recommended',
    waypoints: ['Inaruwa Junction', 'Chatara Bridge', 'Barahachhetra Ridge', 'Dharan Link Road', 'Itahari Reconnect'],
    path: [
      [26.5824, 87.1345],  // Inaruwa
      [26.8645, 87.1642],  // Chatara
      [26.8924, 87.1724],  // Barahachhetra
      [26.8121, 87.2836],  // Dharan link
      [26.6634, 87.2712],  // Itahari
    ],
    color: '#3B82F6',
    advisoryNote: 'Recommended bypass for all civilian traffic. Chatara suspension bridge weight limit: 15 tons. Buses clear.',
  },
  {
    id: 'alt_koshi_02',
    name: 'Laukahi-Saptari Detour via Postal Highway North',
    nepaliName: 'लौकही-सप्तरी बाइपास: हुलाकी राजमार्ग उत्तर',
    sectorId: 'koshi_sector',
    blockedRoad: 'H12 Postal Highway (Hulaki Rajmarg)',
    blockedSegment: 'Lahan → Rajbiraj South (6.8km submerged)',
    bypassName: 'Lahan-Saptakoshi Northern Detour',
    bypassDistanceKm: 55.2,
    extraTimeMins: 50,
    suitableFor: ['cars', 'motorcycles'],
    roadSurface: 'gravel_metalled',
    safetyRating: 'moderate_caution',
    status: 'available',
    waypoints: ['Lahan Town', 'Siraha North', 'Golbazar', 'Saptakoshi Municipality', 'Rajbiraj North Entry'],
    path: [
      [26.7234, 86.4812],  // Lahan
      [26.7812, 86.5234],  // Siraha North
      [26.6445, 86.6812],  // Golbazar
      [26.5812, 86.7234],  // Saptakoshi
      [26.5395, 86.7450],  // Rajbiraj
    ],
    color: '#8B5CF6',
    advisoryNote: 'Northern detour via gravel road. Night driving not recommended. Motorcycles must use headlights.',
  },

  // ── NARAYANI SECTOR ALTERNATE ROUTES ──────────────────────────────────────
  {
    id: 'alt_narayani_01',
    name: 'Bharatpur-Hetauda Bypass via Prithvi Highway Ridge',
    nepaliName: 'भरतपुर-हेटौंडा बाइपास: पृथ्वी राजमार्ग रिज',
    sectorId: 'narayani_sector',
    blockedRoad: 'H01 Mahendra Highway',
    blockedSegment: 'Nawalparasi → Butwal (3.5km restricted near Narayani Bridge)',
    bypassName: 'Prithvi-Tribhuvan Highway Ridge Bypass',
    bypassDistanceKm: 78.4,
    extraTimeMins: 65,
    suitableFor: ['cars', 'motorcycles', 'buses', 'trucks'],
    roadSurface: 'paved_asphalt',
    safetyRating: 'safe',
    status: 'recommended',
    waypoints: ['Bharatpur', 'Mugling Junction', 'Narayanghat Ridge', 'Dumkibas', 'Butwal Reconnect'],
    path: [
      [27.6767, 84.4322],  // Bharatpur
      [27.8834, 84.5612],  // Mugling
      [27.7012, 84.4534],  // Narayanghat
      [27.6234, 84.2812],  // Dumkibas
      [27.6812, 83.4512],  // Butwal
    ],
    color: '#3B82F6',
    advisoryNote: 'Primary recommended bypass via Prithvi Highway. All vehicle types permitted. Well-lit highway.',
  },

  // ── KARNALI SECTOR ALTERNATE ROUTES ───────────────────────────────────────
  {
    id: 'alt_karnali_01',
    name: 'Chisapani-Surkhet Bypass via Kohalpur Bridge',
    nepaliName: 'चिसापानी-सुर्खेत बाइपास: कोहलपुर पुल',
    sectorId: 'karnali_sector',
    blockedRoad: 'H01 Mahendra Highway',
    blockedSegment: 'Karnali Bridge → Rajapur Access (5.2km submerged)',
    bypassName: 'Kohalpur-Nepalgunj Northern Bypass',
    bypassDistanceKm: 64.8,
    extraTimeMins: 55,
    suitableFor: ['cars', 'motorcycles', 'buses', 'trucks'],
    roadSurface: 'paved_asphalt',
    safetyRating: 'safe',
    status: 'recommended',
    waypoints: ['Kohalpur Junction', 'Nepalgunj Airport Link', 'Banke Highway', 'Bardiya Entry', 'Rajapur North'],
    path: [
      [28.2134, 81.7312],  // Kohalpur
      [28.1034, 81.6712],  // Nepalgunj link
      [28.1812, 81.5234],  // Banke Highway
      [28.3234, 81.3812],  // Bardiya
      [28.3534, 81.2912],  // Rajapur North
    ],
    color: '#3B82F6',
    advisoryNote: 'Well-maintained national highway bypass. Bridge at Kohalpur rated for 40-ton loads.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 3. HELICOPTER AIR SUPPORT SORTIES
// ─────────────────────────────────────────────────────────────────────────────

export type WeatherCondition = 'VFR_clear' | 'MVFR_marginal' | 'IFR_instrument' | 'grounded';

export interface HelicopterSortie {
  id: string;
  name: string;
  nepaliName: string;
  sectorId: string;
  missionType: 'evacuation' | 'supply_drop' | 'medical_airlift' | 'recon_survey';
  aircraftType: 'Mi-17_Nepal_Army' | 'Mi_17_Nepal_Army' | 'Bell_206_Private' | 'AS350_Fishtail_Air';
  originBase: string;
  originCoords: [number, number];
  destinationHLZ: string;
  destinationCoords: [number, number];
  intermediateWaypoints: { name: string; coords: [number, number] }[];
  flightPath: [number, number][];   // Full path for polyline rendering
  distanceNm: number;              // Nautical miles
  estimatedFlightTimeMins: number;
  maxPayloadKg: number;
  maxPassengers: number;
  currentWeather: WeatherCondition;
  weatherDetails: {
    visibility_km: number;
    ceiling_ft: number;
    wind_speed_knots: number;
    wind_direction: string;
    precipitation: string;
    turbulence: 'none' | 'light' | 'moderate' | 'severe';
  };
  flightStatus: 'cleared_for_ops' | 'weather_hold' | 'grounded' | 'mission_active';
  missionPriority: 'critical' | 'urgent' | 'routine';
  sortieNotes: string;
  color: string;
}

export const HELICOPTER_SORTIES: HelicopterSortie[] = [
  // ── KOSHI SECTOR HELICOPTER SORTIES ───────────────────────────────────────
  {
    id: 'heli_koshi_evac_01',
    name: 'Biratnagar → Barahachhetra HLZ (Medical Evacuation)',
    nepaliName: 'विराटनगर → वराहक्षेत्र HLZ (मेडिकल एभ्याकुएशन)',
    sectorId: 'koshi_sector',
    missionType: 'medical_airlift',
    aircraftType: 'Mi_17_Nepal_Army',
    originBase: 'Biratnagar Airport (Nepal Army Aviation)',
    originCoords: [26.4812, 87.2645],
    destinationHLZ: 'Barahachhetra High Ridge HLZ',
    destinationCoords: [26.8941, 87.1712],
    intermediateWaypoints: [
      { name: 'Dharan Overfly', coords: [26.8121, 87.2836] },
    ],
    flightPath: [
      [26.4812, 87.2645],   // Biratnagar Airport
      [26.6534, 87.2345],   // Climb out
      [26.8121, 87.2836],   // Dharan overfly
      [26.8941, 87.1712],   // Barahachhetra HLZ
    ],
    distanceNm: 28.4,
    estimatedFlightTimeMins: 18,
    maxPayloadKg: 4000,
    maxPassengers: 24,
    currentWeather: 'MVFR_marginal',
    weatherDetails: {
      visibility_km: 4.5,
      ceiling_ft: 2500,
      wind_speed_knots: 12,
      wind_direction: 'SW 210°',
      precipitation: 'Light rain showers',
      turbulence: 'light',
    },
    flightStatus: 'cleared_for_ops',
    missionPriority: 'critical',
    sortieNotes: 'Priority medical evacuation for snakebite and drowning victims. Mi-17 with field hospital stretcher configuration.',
    color: '#EF4444',
  },
  {
    id: 'heli_koshi_supply_01',
    name: 'Biratnagar → Inaruwa Helipad (Supply Drop)',
    nepaliName: 'विराटनगर → इनरुवा हेलिप्याड (आपूर्ति ड्रप)',
    sectorId: 'koshi_sector',
    missionType: 'supply_drop',
    aircraftType: 'Mi_17_Nepal_Army',
    originBase: 'Biratnagar Airport (Nepal Army Aviation)',
    originCoords: [26.4812, 87.2645],
    destinationHLZ: 'Inaruwa Stadium Sports Complex HLZ',
    destinationCoords: [26.8231, 87.1498],
    intermediateWaypoints: [
      { name: 'Itahari Overfly', coords: [26.6634, 87.2712] },
    ],
    flightPath: [
      [26.4812, 87.2645],
      [26.6634, 87.2712],
      [26.8231, 87.1498],
    ],
    distanceNm: 22.1,
    estimatedFlightTimeMins: 14,
    maxPayloadKg: 4000,
    maxPassengers: 0,
    currentWeather: 'VFR_clear',
    weatherDetails: {
      visibility_km: 8.0,
      ceiling_ft: 5000,
      wind_speed_knots: 8,
      wind_direction: 'NW 320°',
      precipitation: 'None',
      turbulence: 'none',
    },
    flightStatus: 'cleared_for_ops',
    missionPriority: 'urgent',
    sortieNotes: 'Emergency food ration and ORS supply drop. 4-ton palletized load. Landing zone confirmed clear.',
    color: '#F59E0B',
  },
  {
    id: 'heli_koshi_recon_01',
    name: 'Biratnagar → Koshi Floodplain Aerial Survey',
    nepaliName: 'विराटनगर → कोशी बाढी क्षेत्र हवाई सर्वेक्षण',
    sectorId: 'koshi_sector',
    missionType: 'recon_survey',
    aircraftType: 'AS350_Fishtail_Air',
    originBase: 'Biratnagar Airport (Fishtail Air)',
    originCoords: [26.4812, 87.2645],
    destinationHLZ: 'Koshi Barrage Survey Zone (No Landing)',
    destinationCoords: [26.6542, 87.0458],
    intermediateWaypoints: [
      { name: 'Koshi East Bank', coords: [26.5912, 87.1234] },
      { name: 'Flood Extent North', coords: [26.7234, 87.0812] },
    ],
    flightPath: [
      [26.4812, 87.2645],
      [26.5912, 87.1234],
      [26.6542, 87.0458],
      [26.7234, 87.0812],
      [26.6542, 87.0458],   // Return orbit
      [26.4812, 87.2645],   // RTB
    ],
    distanceNm: 48.6,
    estimatedFlightTimeMins: 45,
    maxPayloadKg: 680,
    maxPassengers: 4,
    currentWeather: 'VFR_clear',
    weatherDetails: {
      visibility_km: 10.0,
      ceiling_ft: 8000,
      wind_speed_knots: 6,
      wind_direction: 'N 350°',
      precipitation: 'None',
      turbulence: 'none',
    },
    flightStatus: 'cleared_for_ops',
    missionPriority: 'routine',
    sortieNotes: 'Aerial flood extent survey with GoPro and thermal camera. Circular orbit pattern over Koshi Barrage spillway.',
    color: '#06B6D4',
  },

  // ── NARAYANI SECTOR HELICOPTER SORTIES ────────────────────────────────────
  {
    id: 'heli_narayani_evac_01',
    name: 'Bharatpur → Hetauda Stadium HLZ (Evacuation)',
    nepaliName: 'भरतपुर → हेटौंडा स्टेडियम HLZ (एभ्याकुएशन)',
    sectorId: 'narayani_sector',
    missionType: 'evacuation',
    aircraftType: 'Mi_17_Nepal_Army',
    originBase: 'Bharatpur Airport (Nepal Army)',
    originCoords: [27.6780, 84.4290],
    destinationHLZ: 'Hetauda Municipal Stadium HLZ',
    destinationCoords: [27.1345, 85.3362],
    intermediateWaypoints: [
      { name: 'Devghat Confluence', coords: [27.7112, 84.4134] },
      { name: 'Lothar Valley', coords: [27.4234, 84.8812] },
    ],
    flightPath: [
      [27.6780, 84.4290],
      [27.7112, 84.4134],
      [27.4234, 84.8812],
      [27.1345, 85.3362],
    ],
    distanceNm: 52.3,
    estimatedFlightTimeMins: 32,
    maxPayloadKg: 4000,
    maxPassengers: 24,
    currentWeather: 'MVFR_marginal',
    weatherDetails: {
      visibility_km: 5.0,
      ceiling_ft: 3000,
      wind_speed_knots: 15,
      wind_direction: 'SE 140°',
      precipitation: 'Intermittent drizzle',
      turbulence: 'moderate',
    },
    flightStatus: 'weather_hold',
    missionPriority: 'urgent',
    sortieNotes: 'Mass civilian evacuation from Hetauda low-lying areas. On weather hold; expected window at 1400 local.',
    color: '#F59E0B',
  },
  {
    id: 'heli_narayani_supply_01',
    name: 'Bharatpur → Narayanghat Sports Complex HLZ (Supply)',
    nepaliName: 'भरतपुर → नारायणघाट खेलकुद मैदान (आपूर्ति)',
    sectorId: 'narayani_sector',
    missionType: 'supply_drop',
    aircraftType: 'Mi_17_Nepal_Army',
    originBase: 'Bharatpur Airport',
    originCoords: [27.6780, 84.4290],
    destinationHLZ: 'Narayanghat Sports Complex Helipad',
    destinationCoords: [27.7042, 83.4585],
    intermediateWaypoints: [
      { name: 'Kawasoti Overfly', coords: [27.6024, 83.9645] },
    ],
    flightPath: [
      [27.6780, 84.4290],
      [27.6024, 83.9645],
      [27.7042, 83.4585],
    ],
    distanceNm: 56.8,
    estimatedFlightTimeMins: 35,
    maxPayloadKg: 4000,
    maxPassengers: 0,
    currentWeather: 'VFR_clear',
    weatherDetails: {
      visibility_km: 12.0,
      ceiling_ft: 6000,
      wind_speed_knots: 8,
      wind_direction: 'W 270°',
      precipitation: 'None',
      turbulence: 'light',
    },
    flightStatus: 'cleared_for_ops',
    missionPriority: 'urgent',
    sortieNotes: 'Water purification tablets and ORS sachets for 15,000 displaced families at Narayanghat camps.',
    color: '#22C55E',
  },

  // ── KARNALI SECTOR HELICOPTER SORTIES ─────────────────────────────────────
  {
    id: 'heli_karnali_evac_01',
    name: 'Nepalgunj → Bardiya National Park HLZ (Evacuation)',
    nepaliName: 'नेपालगञ्ज → बर्दिया राष्ट्रिय निकुञ्ज HLZ',
    sectorId: 'karnali_sector',
    missionType: 'evacuation',
    aircraftType: 'Mi_17_Nepal_Army',
    originBase: 'Nepalgunj Airport (Nepal Army Air Wing)',
    originCoords: [28.1034, 81.6712],
    destinationHLZ: 'Bardiya Reserve Elevated HLZ',
    destinationCoords: [28.5265, 81.1298],
    intermediateWaypoints: [
      { name: 'Kohalpur Overfly', coords: [28.2134, 81.7312] },
      { name: 'Banke Ridge', coords: [28.3534, 81.4512] },
    ],
    flightPath: [
      [28.1034, 81.6712],
      [28.2134, 81.7312],
      [28.3534, 81.4512],
      [28.5265, 81.1298],
    ],
    distanceNm: 38.4,
    estimatedFlightTimeMins: 24,
    maxPayloadKg: 4000,
    maxPassengers: 24,
    currentWeather: 'VFR_clear',
    weatherDetails: {
      visibility_km: 15.0,
      ceiling_ft: 10000,
      wind_speed_knots: 5,
      wind_direction: 'N 010°',
      precipitation: 'None',
      turbulence: 'none',
    },
    flightStatus: 'cleared_for_ops',
    missionPriority: 'critical',
    sortieNotes: 'Critical evacuation of Tharu communities isolated by Karnali river breach. Clear VFR conditions.',
    color: '#EF4444',
  },
  {
    id: 'heli_karnali_supply_01',
    name: 'Dhangadhi → Kailali Western HLZ (Supply Drop)',
    nepaliName: 'धनगढी → कैलाली पश्चिमी HLZ (आपूर्ति)',
    sectorId: 'karnali_sector',
    missionType: 'supply_drop',
    aircraftType: 'Bell_206_Private',
    originBase: 'Dhangadhi Airport',
    originCoords: [28.7534, 80.5812],
    destinationHLZ: 'Kailali Western Ridge Camp HLZ',
    destinationCoords: [28.9665, 80.1812],
    intermediateWaypoints: [
      { name: 'Attariya Checkpoint', coords: [28.7712, 80.5434] },
    ],
    flightPath: [
      [28.7534, 80.5812],
      [28.7712, 80.5434],
      [28.9665, 80.1812],
    ],
    distanceNm: 24.6,
    estimatedFlightTimeMins: 20,
    maxPayloadKg: 680,
    maxPassengers: 4,
    currentWeather: 'IFR_instrument',
    weatherDetails: {
      visibility_km: 1.5,
      ceiling_ft: 800,
      wind_speed_knots: 22,
      wind_direction: 'SW 220°',
      precipitation: 'Heavy rain',
      turbulence: 'severe',
    },
    flightStatus: 'grounded',
    missionPriority: 'urgent',
    sortieNotes: 'GROUNDED due to IFR conditions and severe turbulence. Waiting for weather window. Bell 206 not IFR certified.',
    color: '#6B7280',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

export const getReliefRoutesForSector = (sectorId: string): ReliefConvoyRoute[] =>
  RELIEF_CONVOY_ROUTES.filter((r) => r.sectorId === sectorId);

export const getAlternateRoutesForSector = (sectorId: string): AlternateRoute[] =>
  ALTERNATE_ROUTES.filter((r) => r.sectorId === sectorId);

export const getHelicopterSortiesForSector = (sectorId: string): HelicopterSortie[] =>
  HELICOPTER_SORTIES.filter((s) => s.sectorId === sectorId);

export const getWeatherStatusLabel = (weather: WeatherCondition): { label: string; color: string; bgColor: string } => {
  switch (weather) {
    case 'VFR_clear':
      return { label: 'VFR CLEAR', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20 border-emerald-500/40' };
    case 'MVFR_marginal':
      return { label: 'MVFR MARGINAL', color: 'text-amber-400', bgColor: 'bg-amber-500/20 border-amber-500/40' };
    case 'IFR_instrument':
      return { label: 'IFR INSTRUMENT', color: 'text-rose-400', bgColor: 'bg-rose-500/20 border-rose-500/40' };
    case 'grounded':
      return { label: 'GROUNDED', color: 'text-slate-400', bgColor: 'bg-slate-500/20 border-slate-500/40' };
  }
};

export const getFlightStatusLabel = (status: HelicopterSortie['flightStatus']): { label: string; color: string } => {
  switch (status) {
    case 'cleared_for_ops':
      return { label: 'CLEARED FOR OPS', color: 'text-emerald-400' };
    case 'weather_hold':
      return { label: 'WEATHER HOLD', color: 'text-amber-400' };
    case 'grounded':
      return { label: 'GROUNDED', color: 'text-rose-400' };
    case 'mission_active':
      return { label: 'MISSION ACTIVE', color: 'text-cyan-400' };
  }
};
