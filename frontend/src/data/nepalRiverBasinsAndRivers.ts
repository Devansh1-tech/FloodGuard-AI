/**
 * nepalRiverBasinsAndRivers.ts — Comprehensive Geospatial & Hydrological Dataset
 * for Nepal's River Basins & River Networks.
 *
 * Implements real-time hydrological telemetry, basin watersheds, and river centerlines
 * with high-precision geospatial coordinates for interactive dotted-line mapping.
 */

export interface RiverBasinData {
  id: string;
  name: string;
  nepaliName: string;
  majorSystem: 'Koshi' | 'Gandaki' | 'Karnali' | 'Mahakali' | 'Southern_Terai';
  catchmentAreaKm2: number;
  averageAnnualDischargeM3s: number;
  color: string;
  riskLevel: 'critical' | 'severe' | 'moderate' | 'normal';
  description: string;
  nepaliDescription: string;
  keyDistricts: string[];
  keyRivers: string[];
  boundaryPolygon: [number, number][]; // [lat, lng]
}

export interface DownstreamRiparianRisk {
  settlement: string;
  nepaliSettlement: string;
  district: string;
  leadTimeHours: number;
  populationAtRisk: number;
  safeHaven: string;
  safeHavenNepali: string;
}

export interface LiveRiverData {
  id: string;
  name: string;
  nepaliName: string;
  basinId: string;
  basinName: string;
  lengthKm: number;
  origin: string;
  confluence: string;
  keyDistricts: string[];
  coordinates: [number, number][]; // [lat, lng] polyline points
  dhmStationNumber: string;
  dhmStationName: string;
  currentLevelMeters: number;
  warningLevelMeters: number;
  dangerLevelMeters: number;
  highestHistoricalLevelMeters: number;
  historicalRecordYear: number;
  dischargeCusecs: number;
  dischargeM3s: number;
  velocityMs: number;
  status: 'extreme_flood' | 'danger' | 'warning' | 'normal';
  trend: 'rising_rapidly' | 'rising' | 'steady' | 'receding';
  rateOfRiseCmPerHour: number;
  rainfallLast24hMm: number;
  barrageInfo?: {
    name: string;
    totalGates: number;
    gatesOpen: number;
    sluiceStatus: string;
  };
  downstreamSettlements: DownstreamRiparianRisk[];
  civilProtectionDirective: string;
  nepaliDirective: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. NEPAL RIVER BASINS (WATERSHEDS & DOTTED OUTLINES)
// ─────────────────────────────────────────────────────────────────────────────
export const NEPAL_RIVER_BASINS: RiverBasinData[] = [
  {
    id: 'basin_koshi',
    name: 'Koshi (Saptakoshi) River Basin',
    nepaliName: 'सप्तकोशी नदी बेसिन (पूर्वी नेपाल)',
    majorSystem: 'Koshi',
    catchmentAreaKm2: 60400,
    averageAnnualDischargeM3s: 1564,
    color: '#00F2FE', // Electric Cyan
    riskLevel: 'critical',
    description: 'Eastern Nepal master drainage basin fed by 7 glacial tributaries, monitored along the Sunsari and Saptari alluvial flood plain.',
    nepaliDescription: '७ वटा मुख्य हिम नदीहरू मिलेर बनेको पूर्वी नेपालको सबैभन्दा ठूलो नदी बेसिन।',
    keyDistricts: ['Sunsari', 'Saptari', 'Morang', 'Udayapur'],
    keyRivers: ['Saptakoshi', 'Sun Koshi', 'Arun', 'Tamor', 'Kankai'],
    boundaryPolygon: [
      [27.02, 87.12], [26.96, 87.28], [26.82, 87.35], [26.65, 87.32],
      [26.48, 87.26], [26.48, 86.95], [26.50, 86.75], [26.65, 86.62],
      [26.85, 86.68], [26.98, 86.95], [27.02, 87.12]
    ],
  },
  {
    id: 'basin_gandaki',
    name: 'Gandaki (Narayani) River Basin',
    nepaliName: 'गण्डकी (नारायणी) नदी बेसिन (मध्य नेपाल)',
    majorSystem: 'Gandaki',
    catchmentAreaKm2: 34960,
    averageAnnualDischargeM3s: 1600,
    color: '#38BDF8', // Sky Blue
    riskLevel: 'critical',
    description: 'Central Nepal major river system draining Chitwan valley, Nawalpur, and Parasi alluvial lowlands down to Gandak Barrage.',
    nepaliDescription: 'कालीगण्डकी, त्रिशूली, मर्स्याङ्दीलगायत ७ गण्डकी नदीहरूको संगम बेसिन।',
    keyDistricts: ['Chitwan', 'Nawalpur', 'Parasi'],
    keyRivers: ['Narayani', 'Kali Gandaki', 'Trishuli', 'East Rapti'],
    boundaryPolygon: [
      [27.75, 84.45], [27.70, 84.58], [27.56, 84.52], [27.42, 84.28],
      [27.42, 83.85], [27.56, 83.70], [27.70, 83.82], [27.76, 84.20],
      [27.75, 84.45]
    ],
  },
  {
    id: 'basin_karnali',
    name: 'Karnali River Basin',
    nepaliName: 'कर्णाली नदी बेसिन (पश्चिम नेपाल)',
    majorSystem: 'Karnali',
    catchmentAreaKm2: 44000,
    averageAnnualDischargeM3s: 1397,
    color: '#818CF8', // Indigo
    riskLevel: 'critical',
    description: 'Longest river system in Nepal, entering Terai at Chisapani gorge and fanning across the fertile delta plains of Kailali and Bardiya.',
    nepaliDescription: 'नेपालको सबैभन्दा लामो नदी प्रणाली, तिब्बतबाट उत्पत्ति भई चिसापानी हुँदै तराईमा प्रवेश गर्दछ।',
    keyDistricts: ['Kailali', 'Bardiya'],
    keyRivers: ['Karnali', 'Bheri', 'Seti', 'Geruwa', 'Kauralia'],
    boundaryPolygon: [
      [28.65, 81.28], [28.58, 81.42], [28.38, 81.45], [28.22, 81.35],
      [28.20, 81.08], [28.38, 81.05], [28.56, 81.18], [28.65, 81.28]
    ],
  },
  {
    id: 'basin_mahakali',
    name: 'Mahakali River Basin',
    nepaliName: 'महाकाली नदी बेसिन (सुदूरपश्चिम सीमा)',
    majorSystem: 'Mahakali',
    catchmentAreaKm2: 15260,
    averageAnnualDischargeM3s: 673,
    color: '#A78BFA', // Purple
    riskLevel: 'severe',
    description: 'Western international border river system draining Kanchanpur plains, Dodhara-Chandani, and Belauri lowlands.',
    nepaliDescription: 'नेपालको पश्चिमी सिमाना भएर बग्ने महाकाली नदीको जलप्रणाली।',
    keyDistricts: ['Kanchanpur'],
    keyRivers: ['Mahakali', 'Chameliya', 'Surna'],
    boundaryPolygon: [
      [29.05, 80.15], [28.98, 80.32], [28.82, 80.35], [28.72, 80.26],
      [28.72, 80.10], [28.85, 80.08], [29.05, 80.15]
    ],
  },
  {
    id: 'basin_west_rapti',
    name: 'West Rapti River Basin',
    nepaliName: 'पश्चिम राप्ती नदी बेसिन (बाँके / दाङ)',
    majorSystem: 'Southern_Terai',
    catchmentAreaKm2: 6500,
    averageAnnualDischargeM3s: 215,
    color: '#F43F5E', // Rose Red
    riskLevel: 'critical',
    description: 'Flash-flood prone basin draining inner Terai valley of Dang and vulnerable lowlands of Banke.',
    nepaliDescription: 'दाङ उपत्यका र बाँकेको होचा भूभागलाई जलमग्न बनाउने तीव्र बाढी बेसिन।',
    keyDistricts: ['Banke', 'Dang'],
    keyRivers: ['West Rapti', 'Jhimruk', 'Mari', 'Duduwa'],
    boundaryPolygon: [
      [28.18, 82.25], [28.08, 82.20], [27.95, 81.95], [27.80, 81.68],
      [27.80, 81.54], [27.92, 81.56], [28.05, 81.75], [28.18, 82.05],
      [28.18, 82.25]
    ],
  },
  {
    id: 'basin_babai',
    name: 'Babai River Basin',
    nepaliName: 'बबई नदी बेसिन (बर्दिया / दाङ)',
    majorSystem: 'Southern_Terai',
    catchmentAreaKm2: 3400,
    averageAnnualDischargeM3s: 95,
    color: '#FB923C', // Amber Orange
    riskLevel: 'critical',
    description: 'Churia-origin river basin traversing Bardiya National Park and agricultural breadbasket of Gulariya.',
    nepaliDescription: 'चुरे पर्वतबाट उत्पत्ति भई बर्दियाका उर्वर भूभाग हुँदै भारततर्फ बग्ने नदी बेसिन।',
    keyDistricts: ['Bardiya', 'Dang'],
    keyRivers: ['Babai', 'Sharada'],
    boundaryPolygon: [
      [28.42, 81.85], [28.32, 81.75], [28.22, 81.50], [28.12, 81.30],
      [28.12, 81.25], [28.25, 81.28], [28.38, 81.55], [28.42, 81.85]
    ],
  },
  {
    id: 'basin_bagmati',
    name: 'Bagmati & Lalbakeya River Basin',
    nepaliName: 'बागमती तथा लालबकैया बेसिन (रौतहट / सर्लाही)',
    majorSystem: 'Southern_Terai',
    catchmentAreaKm2: 3750,
    averageAnnualDischargeM3s: 165,
    color: '#EF4444', // Danger Red
    riskLevel: 'critical',
    description: 'Central Terai floodplain basin notorious for catastrophic inundation of Gaur and Rautahat-Sarlahi lowlands.',
    nepaliDescription: 'रौतहटको गौर तथा सर्लाहीका सीमावर्ती बस्तीहरूलाई बर्सेनि डुबानमा पार्ने बेसिन।',
    keyDistricts: ['Rautahat', 'Sarlahi'],
    keyRivers: ['Bagmati', 'Lalbakeya', 'Marin'],
    boundaryPolygon: [
      [27.15, 85.42], [27.05, 85.45], [26.88, 85.42], [26.76, 85.35],
      [26.76, 85.24], [26.90, 85.25], [27.08, 85.32], [27.15, 85.42]
    ],
  },
  {
    id: 'basin_kamala',
    name: 'Kamala & Jalad River Basin',
    nepaliName: 'कमला तथा जलाद बेसिन (सिराहा / धनुषा)',
    majorSystem: 'Southern_Terai',
    catchmentAreaKm2: 2100,
    averageAnnualDischargeM3s: 82,
    color: '#F59E0B', // Amber
    riskLevel: 'severe',
    description: 'Mid-Eastern Terai flash-flood corridor prone to sudden breach of earthen dykes across Dhanusha and Siraha.',
    nepaliDescription: 'धनुषा र सिराहाको सिमानामा रहेका बाँध भत्किएर गाउँ बस्तीमा बाढी पस्ने संवेदनशील बेसिन।',
    keyDistricts: ['Dhanusha', 'Siraha'],
    keyRivers: ['Kamala', 'Jalad', 'Tawa'],
    boundaryPolygon: [
      [27.12, 86.12], [27.02, 86.20], [26.85, 86.18], [26.66, 86.10],
      [26.66, 85.86], [26.85, 85.88], [27.05, 85.98], [27.12, 86.12]
    ],
  },
  {
    id: 'basin_tinau_rohini',
    name: 'Tinau & Rohini River Basin',
    nepaliName: 'तिनाउ तथा रोहिणी बेसिन (रुपन्देही / नवलपरासी)',
    majorSystem: 'Southern_Terai',
    catchmentAreaKm2: 1200,
    averageAnnualDischargeM3s: 48,
    color: '#10B981', // Emerald
    riskLevel: 'severe',
    description: 'Urban and agricultural drainage corridor through Butwal and the vulnerable Marchawar border lowlands.',
    nepaliDescription: 'बुटवल सहर हुँदै भैरहवा र मर्चवारका दक्षिणी सिमाना जलमग्न बनाउने बेसिन।',
    keyDistricts: ['Rupandehi', 'Kapilvastu'],
    keyRivers: ['Tinau', 'Rohini', 'Danav'],
    boundaryPolygon: [
      [27.72, 83.48], [27.65, 83.62], [27.50, 83.58], [27.42, 83.48],
      [27.42, 83.38], [27.54, 83.35], [27.68, 83.42], [27.72, 83.48]
    ],
  },
  {
    id: 'basin_kankai_mechi',
    name: 'Kankai & Mechi River Basin',
    nepaliName: 'कन्काई तथा मेची बेसिन (झापा / मोरङ)',
    majorSystem: 'Southern_Terai',
    catchmentAreaKm2: 1480,
    averageAnnualDischargeM3s: 62,
    color: '#06B6D4', // Cyan
    riskLevel: 'severe',
    description: 'Far-Eastern Terai flash-flood system causing severe riverbank scouring across fertile paddy farmlands of Jhapa.',
    nepaliDescription: 'इलामका पहाडबाट झापाका धानखेत हुँदै भारत सीमामा प्रवेश गर्ने संवेदनशील नदी बेसिन।',
    keyDistricts: ['Jhapa', 'Morang'],
    keyRivers: ['Kankai', 'Mechi', 'Biring'],
    boundaryPolygon: [
      [26.92, 87.95], [26.85, 88.12], [26.65, 88.12], [26.42, 88.08],
      [26.42, 87.82], [26.62, 87.80], [26.82, 87.88], [26.92, 87.95]
    ],
  },
  {
    id: 'basin_mohana',
    name: 'Mohana & Khutiya River Basin',
    nepaliName: 'मोहना तथा खुटिया बेसिन (कैलाली सीमा)',
    majorSystem: 'Southern_Terai',
    catchmentAreaKm2: 1100,
    averageAnnualDischargeM3s: 42,
    color: '#EC4899', // Pink
    riskLevel: 'critical',
    description: 'Border-hugging lowland drainage basin causing prolonged stagnation and postal highway cut-offs at Bhajani.',
    nepaliDescription: 'भजनी र धनगढी दक्षिणी भेगमा लामो समय पानी जम्ने समस्या सिर्जना गर्ने सीमावर्ती बेसिन।',
    keyDistricts: ['Kailali', 'Kanchanpur'],
    keyRivers: ['Mohana', 'Khutiya', 'Kandra'],
    boundaryPolygon: [
      [28.72, 80.60], [28.65, 80.85], [28.48, 81.12], [28.40, 81.08],
      [28.45, 80.70], [28.60, 80.56], [28.72, 80.60]
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 2. NEPAL INDIVIDUAL RIVERS (POLYLINE PATHS & REAL-TIME HYDROLOGY)
// ─────────────────────────────────────────────────────────────────────────────
export const NEPAL_RIVERS: LiveRiverData[] = [
  // ── 1. SAPTAKOSHI RIVER ───────────────────────────────────────────────────
  {
    id: 'river_saptakoshi',
    name: 'Saptakoshi River',
    nepaliName: 'सप्तकोशी नदी (पूर्वी नेपालको विशाल नदी)',
    basinId: 'basin_koshi',
    basinName: 'Koshi (Saptakoshi) River Basin',
    lengthKm: 720,
    origin: 'Triveni Confluence (Sun Koshi, Arun & Tamor), Barahachhetra',
    confluence: 'Ganges River at Kursela (Bihar, India)',
    keyDistricts: ['Sunsari', 'Saptari', 'Morang', 'Udayapur'],
    coordinates: [
      [27.02, 87.12], // Upper Sun Koshi confluence
      [26.90, 87.15], // Barahachhetra Gorge
      [26.82, 87.15], // Chatara DHM Station
      [26.75, 87.08], // Prakashpur flood zone
      [26.68, 87.01], // Mahendranagar Sunsari
      [26.60, 86.97], // Hanumannagar Kankalini
      [26.54, 86.94], // Koshi Barrage Sluice Dam
      [26.50, 86.92], // Bhantabari Customs Border
    ],
    dhmStationNumber: 'DHM-695',
    dhmStationName: 'Chatara Hydrological Station',
    currentLevelMeters: 7.85,
    warningLevelMeters: 6.00,
    dangerLevelMeters: 7.20,
    highestHistoricalLevelMeters: 8.65,
    historicalRecordYear: 2008,
    dischargeCusecs: 462000,
    dischargeM3s: 13082,
    velocityMs: 3.8,
    status: 'extreme_flood',
    trend: 'rising_rapidly',
    rateOfRiseCmPerHour: 18,
    rainfallLast24hMm: 184,
    barrageInfo: {
      name: 'Koshi Barrage (Sunsari / Saptari)',
      totalGates: 56,
      gatesOpen: 56,
      sluiceStatus: 'All 56 Red Warning Flags hoisted; maximum discharge flow',
    },
    downstreamSettlements: [
      {
        settlement: 'Bhantabari Border Settlement',
        nepaliSettlement: 'भन्टाबारी सीमावर्ती बस्ती',
        district: 'Sunsari',
        leadTimeHours: 1.5,
        populationAtRisk: 14500,
        safeHaven: 'Barahachhetra Elevated Ridge Camp',
        safeHavenNepali: 'वराहक्षेत्र सुरक्षित शिविर',
      },
      {
        settlement: 'Hanumannagar & Gobargadha Islands',
        nepaliSettlement: 'हनुमाननगर तथा गोबरगाढा टापु',
        district: 'Saptari',
        leadTimeHours: 2.0,
        populationAtRisk: 22000,
        safeHaven: 'Rajbiraj Stadium Evacuation Hub',
        safeHavenNepali: 'राजविराज रंगशाला उद्धार केन्द्र',
      },
      {
        settlement: 'Prakashpur Riverside Ward 4',
        nepaliSettlement: 'प्रकाशपुर नदी किनार वडा नं ४',
        district: 'Sunsari',
        leadTimeHours: 1.0,
        populationAtRisk: 9800,
        safeHaven: 'Inaruwa Higher Secondary Safe Campus',
        safeHavenNepali: 'इनरुवा उच्च मावि सुरक्षित क्षेत्र',
      },
    ],
    civilProtectionDirective: 'CRITICAL EVACUATION DIRECTIVE: Saptakoshi is 0.65m above danger level. APF Zodiac motorboats deployed. Complete evacuation of Gobargadha island and Prakashpur riparian belts ordered.',
    nepaliDirective: 'अत्यन्त जरुरी सूचना: सप्तकोशी नदी खतरा विन्दुभन्दा ६५ सेमी माथि बगिरहेको छ। गोबरगाढा टापु र प्रकाशपुरका बासिन्दाहरूलाई तुरुन्तै सुरक्षित स्थानतर्फ जान अनुरोध गरिन्छ।',
  },

  // ── 2. NARAYANI / GANDAKI RIVER ───────────────────────────────────────────
  {
    id: 'river_narayani',
    name: 'Narayani (Gandaki) River',
    nepaliName: 'नारायणी (गण्डकी) नदी (चितवन / नवलपरासी)',
    basinId: 'basin_gandaki',
    basinName: 'Gandaki (Narayani) River Basin',
    lengthKm: 338,
    origin: 'Devghat Confluence (Trishuli & Kali Gandaki Rivers)',
    confluence: 'Ganges River at Patna (Bihar, India)',
    keyDistricts: ['Chitwan', 'Nawalpur', 'Parasi'],
    coordinates: [
      [27.85, 84.45], // Trishuli River approach
      [27.71, 84.42], // Devghat confluence DHM Station
      [27.68, 84.40], // Narayangarh Riverfront
      [27.62, 84.34], // Gaidakot & Shivarajpur
      [27.56, 84.28], // Kawasoti Riparian Plain
      [27.48, 84.18], // Meghauli & Chitwan National Park
      [27.42, 84.15], // Tribeni Confluence
      [27.38, 84.05], // Gandak Barrage (Border)
    ],
    dhmStationNumber: 'DHM-450',
    dhmStationName: 'Devghat Hydrological Station',
    currentLevelMeters: 8.75,
    warningLevelMeters: 7.30,
    dangerLevelMeters: 8.40,
    highestHistoricalLevelMeters: 10.30,
    historicalRecordYear: 2021,
    dischargeCusecs: 395000,
    dischargeM3s: 11185,
    velocityMs: 4.1,
    status: 'extreme_flood',
    trend: 'rising_rapidly',
    rateOfRiseCmPerHour: 16,
    rainfallLast24hMm: 162,
    barrageInfo: {
      name: 'Gandak Barrage (Triveni)',
      totalGates: 36,
      gatesOpen: 36,
      sluiceStatus: 'All 36 sluices opened to prevent embankment overtopping',
    },
    downstreamSettlements: [
      {
        settlement: 'Narayangarh Riverside Market & Meghauli',
        nepaliSettlement: 'नारायणगढ नदी किनार बजार तथा मेघौली',
        district: 'Chitwan',
        leadTimeHours: 1.2,
        populationAtRisk: 31000,
        safeHaven: 'Bharatpur Central Camp Grounds',
        safeHavenNepali: 'भरतपुर केन्द्रीय क्याम्प सुरक्षित स्थल',
      },
      {
        settlement: 'Gaidakot & Kawasoti Riparian Plain',
        nepaliSettlement: 'गैँडाकोट तथा कावासोती तटीय क्षेत्र',
        district: 'Nawalpur',
        leadTimeHours: 2.1,
        populationAtRisk: 24000,
        safeHaven: 'Kawasoti Higher Secondary Safe Hub',
        safeHavenNepali: 'कावासोती उच्च मावि सुरक्षित केन्द्र',
      },
    ],
    civilProtectionDirective: 'FLASH FLOOD EVACUATION: Narayani has breached 8.4m danger mark. Water entering Madi valley and Narayangarh lowlands. Riverside hotels and settlements to relocate immediately.',
    nepaliDirective: 'नारायणी नदीमा जलस्तर खतराको विन्दु नाघेर ८.७५ मिटर पुगेको छ। नारायणगढ, मेघौली र कावासोतीका तटीय बासिन्दाहरू उच्च सतर्कताका साथ सुरक्षित शिविरमा जानुहोस्।',
  },

  // ── 3. KARNALI RIVER & DELTA ──────────────────────────────────────────────
  {
    id: 'river_karnali',
    name: 'Karnali River',
    nepaliName: 'कर्णाली नदी (नेपालको सबैभन्दा लामो नदी)',
    basinId: 'basin_karnali',
    basinName: 'Karnali River Basin',
    lengthKm: 507,
    origin: 'Mount Kailash / Mansarovar Lake region (Tibet)',
    confluence: 'Ghaghara River & Ganges River at Revelganj (India)',
    keyDistricts: ['Kailali', 'Bardiya', 'Surkhet'],
    coordinates: [
      [28.78, 81.32], // Upper gorge near Babai pass
      [28.64, 81.28], // Chisapani Cable Bridge DHM Station
      [28.58, 81.24], // Bifurcation Point into Geruwa
      [28.50, 81.20], // Daulatpur floodway
      [28.42, 81.16], // Geruwa Island East Channel
      [28.34, 81.12], // Tikapur Riverside Park
      [28.26, 81.08], // Rajapur southern tip
      [28.18, 81.05], // Indo-Nepal Border Delta
    ],
    dhmStationNumber: 'DHM-280',
    dhmStationName: 'Chisapani Cable Bridge Station',
    currentLevelMeters: 10.40,
    warningLevelMeters: 9.00,
    dangerLevelMeters: 10.00,
    highestHistoricalLevelMeters: 12.80,
    historicalRecordYear: 2013,
    dischargeCusecs: 310000,
    dischargeM3s: 8778,
    velocityMs: 3.5,
    status: 'danger',
    trend: 'rising',
    rateOfRiseCmPerHour: 15,
    rainfallLast24hMm: 145,
    downstreamSettlements: [
      {
        settlement: 'Tikapur, Daulatpur & Geruwa Island',
        nepaliSettlement: 'टीकापुर, दौलतपुर तथा गेरुवा टापु',
        district: 'Kailali',
        leadTimeHours: 3.0,
        populationAtRisk: 34000,
        safeHaven: 'Tikapur Elevated Stadium & HLZ',
        safeHavenNepali: 'टीकापुर रंगशाला तथा हेलिप्याड',
      },
      {
        settlement: 'Rajapur Island Floodplain',
        nepaliSettlement: 'राजापुर टापु बाढीग्रस्त क्षेत्र',
        district: 'Bardiya',
        leadTimeHours: 3.5,
        populationAtRisk: 29500,
        safeHaven: 'Rajapur Ring Bund Embankment School',
        safeHavenNepali: 'राजापुर रिङ बाँध तथा विद्यालय',
      },
    ],
    civilProtectionDirective: 'ISLAND FLOOD ALERT: Karnali gauge at Chisapani has crossed 10.0m danger level. Rajapur island faces isolation. Civil administration moving food and medical kits via army rafts.',
    nepaliDirective: 'चिसापानीमा कर्णालीको बहाव १०.४ मिटर पुगेको छ। राजापुर टापु र टीकापुरका होचा भूभागमा पानी पस्न सुरु भएकाले तत्काल सुरक्षित स्थानमा सर्नुहोस्।',
  },

  // ── 4. BAGMATI RIVER ──────────────────────────────────────────────────────
  {
    id: 'river_bagmati',
    name: 'Bagmati River',
    nepaliName: 'बागमती नदी (रौतहट तथा सर्लाही सीमा)',
    basinId: 'basin_bagmati',
    basinName: 'Bagmati & Lalbakeya River Basin',
    lengthKm: 597,
    origin: 'Bagdwar, Shivapuri Hills (Kathmandu)',
    confluence: 'Koshi River at Badlaghat (Bihar, India)',
    keyDistricts: ['Rautahat', 'Sarlahi', 'Makwanpur'],
    coordinates: [
      [27.35, 85.48], // Churia Hill exit at Nunther
      [27.18, 85.42], // Bagmati Irrigation Project
      [27.11, 85.38], // Karmaiya Barrage DHM Station
      [27.02, 85.34], // Pipra Rajdevi & Barahathawa
      [26.92, 85.31], // Brahmapuri Riparian Settlement
      [26.85, 85.28], // Gaur Outskirts
      [26.78, 85.26], // Gaur Municipality Border Ring Bund
      [26.76, 85.26], // Gaur South Border
    ],
    dhmStationNumber: 'DHM-550.5',
    dhmStationName: 'Karmaiya Hydrological Station',
    currentLevelMeters: 8.95,
    warningLevelMeters: 6.80,
    dangerLevelMeters: 8.00,
    highestHistoricalLevelMeters: 9.80,
    historicalRecordYear: 1993,
    dischargeCusecs: 285000,
    dischargeM3s: 8070,
    velocityMs: 3.2,
    status: 'extreme_flood',
    trend: 'rising_rapidly',
    rateOfRiseCmPerHour: 22,
    rainfallLast24hMm: 198,
    barrageInfo: {
      name: 'Bagmati Irrigation Barrage (Karmaiya)',
      totalGates: 30,
      gatesOpen: 30,
      sluiceStatus: 'All 30 sluices open; sediment buildup reported',
    },
    downstreamSettlements: [
      {
        settlement: 'Gaur Headquarters & Pipra',
        nepaliSettlement: 'गौर सदरमुकाम तथा पिपरा बस्ती',
        district: 'Rautahat',
        leadTimeHours: 2.2,
        populationAtRisk: 39800,
        safeHaven: 'Chandranigahapur Multi-Purpose Shelter',
        safeHavenNepali: 'चन्द्रनिगाहपुर बहुउद्देश्यीय आश्रयस्थल',
      },
      {
        settlement: 'Barahathawa & Godaita',
        nepaliSettlement: 'बरहथवा तथा गोडैता',
        district: 'Sarlahi',
        leadTimeHours: 2.5,
        populationAtRisk: 28500,
        safeHaven: 'Lalbandi Elevated High School',
        safeHavenNepali: 'लालबन्दी उच्च माध्यमिक विद्यालय',
      },
    ],
    civilProtectionDirective: 'SEVERE INUNDATION EMERGENCY: Bagmati flow at 8.95m (nearly 1m above danger line). Southern Gaur ring dyke waterlogging imminent. Evacuate elderly and children immediately.',
    nepaliDirective: 'बागमती नदी कर्मैयामा खतरा विन्दु पार गरी ८.९५ मिटर पुगेको छ। गौर नगरपालिका डुबानको उच्च जोखिममा छ। सम्पूर्ण नागरिकहरूलाई सुरक्षित स्थानमा जान आग्रह गरिन्छ।',
  },

  // ── 5. LALBAKEYA RIVER ────────────────────────────────────────────────────
  {
    id: 'river_lalbakeya',
    name: 'Lalbakeya River',
    nepaliName: 'लालबकैया नदी (रौतहटको तीव्र बाढी)',
    basinId: 'basin_bagmati',
    basinName: 'Bagmati & Lalbakeya River Basin',
    lengthKm: 110,
    origin: 'Makwanpur / Chandranigahapur Churia Foothills',
    confluence: 'Bagmati River south of Gaur (India border)',
    keyDistricts: ['Rautahat'],
    coordinates: [
      [27.15, 85.32], // Chandranigahapur west
      [27.05, 85.30], // Tikulia Bridge area
      [26.95, 85.29], // Banjaraha DHM Station
      [26.85, 85.29], // Gaur western ring dyke
      [26.75, 85.27], // Border confluence
    ],
    dhmStationNumber: 'DHM-555',
    dhmStationName: 'Banjaraha Hydrological Station',
    currentLevelMeters: 4.80,
    warningLevelMeters: 3.20,
    dangerLevelMeters: 4.00,
    highestHistoricalLevelMeters: 5.25,
    historicalRecordYear: 2017,
    dischargeCusecs: 92000,
    dischargeM3s: 2605,
    velocityMs: 2.9,
    status: 'extreme_flood',
    trend: 'rising',
    rateOfRiseCmPerHour: 14,
    rainfallLast24hMm: 175,
    downstreamSettlements: [
      {
        settlement: 'Banjaraha & Tikulia Rural Settlements',
        nepaliSettlement: 'बन्जरहा तथा टिकुलिया ग्रामीण बस्ती',
        district: 'Rautahat',
        leadTimeHours: 0.8,
        populationAtRisk: 14200,
        safeHaven: 'Chandranigahapur Safe Elevation Zone',
        safeHavenNepali: 'चन्द्रनिगाहपुर सुरक्षित क्षेत्र',
      },
    ],
    civilProtectionDirective: 'DYKE BREACH ALERT: Lalbakeya river earthen dyke damaged at Tikulia. Rapid flash flood waters flowing into western Gaur agricultural wards.',
    nepaliDirective: 'लालबकैया नदीमा बाँध भत्किएर टिकुलिया र बन्जरहा क्षेत्र डुबानमा परेको छ। तत्काल उच्च सुरक्षित बाँधतर्फ जानुहोस्।',
  },

  // ── 6. WEST RAPTI RIVER ───────────────────────────────────────────────────
  {
    id: 'river_west_rapti',
    name: 'West Rapti River',
    nepaliName: 'पश्चिम राप्ती नदी (बाँके / दाङ)',
    basinId: 'basin_west_rapti',
    basinName: 'West Rapti River Basin',
    lengthKm: 257,
    origin: 'Confluence of Jhimruk & Mari Khola (Pyuthan / Rolpa)',
    confluence: 'Ghaghara River (Uttar Pradesh, India)',
    keyDistricts: ['Banke', 'Dang'],
    coordinates: [
      [28.18, 82.35], // Bhalubang Gorge
      [28.08, 82.25], // Kusum DHM Station
      [28.01, 82.12], // Shamsherganj Plain
      [27.95, 81.85], // Kamdi & Betahani
      [27.88, 81.70], // Holiya flood corridor
      [27.82, 81.58], // Narainapur Southern Border
      [27.78, 81.52], // Laxmanpur Barrage
    ],
    dhmStationNumber: 'DHM-350',
    dhmStationName: 'Kusum Hydrological Station',
    currentLevelMeters: 6.95,
    warningLevelMeters: 5.00,
    dangerLevelMeters: 6.20,
    highestHistoricalLevelMeters: 8.40,
    historicalRecordYear: 2014,
    dischargeCusecs: 185000,
    dischargeM3s: 5238,
    velocityMs: 3.4,
    status: 'extreme_flood',
    trend: 'rising_rapidly',
    rateOfRiseCmPerHour: 19,
    rainfallLast24hMm: 188,
    barrageInfo: {
      name: 'Laxmanpur Barrage (Border)',
      totalGates: 22,
      gatesOpen: 22,
      sluiceStatus: 'Backwater effect inundating Holiya and Narainapur',
    },
    downstreamSettlements: [
      {
        settlement: 'Holiya, Kamdi & Fattepur',
        nepaliSettlement: 'होलिया, कम्दी तथा फत्तेपुर बस्ती',
        district: 'Banke',
        leadTimeHours: 2.8,
        populationAtRisk: 27500,
        safeHaven: 'Kohalpur Evacuation Sports Arena HLZ',
        safeHavenNepali: 'कोहलपुर खेलकुद मैदान हेलिप्याड',
      },
      {
        settlement: 'Narainapur Rural Border Ward',
        nepaliSettlement: 'नरैनापुर सीमावर्ती बस्ती',
        district: 'Banke',
        leadTimeHours: 3.2,
        populationAtRisk: 19800,
        safeHaven: 'Shamsherganj Military Staging Haven',
        safeHavenNepali: 'शम्शेरगञ्ज सैन्य शिविर',
      },
    ],
    civilProtectionDirective: 'EMERGENCY FLOOD PROTOCOL: West Rapti has surpassed 6.2m danger mark at Kusum. Laxmanpur backwaters rising rapidly in Holiya and Narainapur. Move livestock to elevated mounds.',
    nepaliDirective: 'पश्चिम राप्ती नदी कुसुममा ६.९५ मिटर पुगी खतराको विन्दु नाघेको छ। होलिया, फत्तेपुर र नरैनापुरमा जलमग्न भएकाले तत्काल कोहलपुर सुरक्षित केन्द्रतर्फ लाग्नुहोस्।',
  },

  // ── 7. BABAI RIVER ────────────────────────────────────────────────────────
  {
    id: 'river_babai',
    name: 'Babai River',
    nepaliName: 'बबई नदी (बर्दियाको जीवनरेखा)',
    basinId: 'basin_babai',
    basinName: 'Babai River Basin',
    lengthKm: 190,
    origin: 'Dang Churia Foothills / Sharada Khola Confluence',
    confluence: 'Ghaghara River (India)',
    keyDistricts: ['Bardiya', 'Dang'],
    coordinates: [
      [28.48, 81.92], // Churia pass exiting Dang
      [28.38, 81.76], // Chepang Gorge DHM Station
      [28.32, 81.56], // Babai Irrigation Barrage
      [28.25, 81.42], // Thakurdwara / National Park
      [28.18, 81.34], // Gulariya District Headquarters
      [28.12, 81.25], // Padnaha Border Settlement
    ],
    dhmStationNumber: 'DHM-360',
    dhmStationName: 'Chepang Hydrological Station',
    currentLevelMeters: 6.45,
    warningLevelMeters: 5.50,
    dangerLevelMeters: 6.10,
    highestHistoricalLevelMeters: 7.90,
    historicalRecordYear: 2017,
    dischargeCusecs: 124000,
    dischargeM3s: 3511,
    velocityMs: 2.8,
    status: 'danger',
    trend: 'rising',
    rateOfRiseCmPerHour: 13,
    rainfallLast24hMm: 152,
    barrageInfo: {
      name: 'Babai Irrigation Barrage',
      totalGates: 18,
      gatesOpen: 18,
      sluiceStatus: 'All 18 sluices opened to relieve headworks pressure',
    },
    downstreamSettlements: [
      {
        settlement: 'Gulariya Municipality & Padnaha',
        nepaliSettlement: 'गुलरिया नगरपालिका तथा पद्नाहा',
        district: 'Bardiya',
        leadTimeHours: 2.2,
        populationAtRisk: 23500,
        safeHaven: 'Bhurigaon Higher Secondary Safe Hub',
        safeHavenNepali: 'भुरीगाउँ उच्च मावि सुरक्षित केन्द्र',
      },
    ],
    civilProtectionDirective: 'HIGH WATER ALERT: Babai River at Chepang has crossed 6.10m danger mark. Gulariya road access threatened. Security forces assisting vulnerable families.',
    nepaliDirective: 'बबई नदी चेपाङमा ६.४५ मिटर पुगेर खतरा विन्दु पार गरेको छ। गुलरिया र पद्नाहाका बासिन्दाहरूलाई तुरुन्तै उच्च स्थानमा जान अनुरोध छ।',
  },

  // ── 8. KAMALA RIVER ───────────────────────────────────────────────────────
  {
    id: 'river_kamala',
    name: 'Kamala River',
    nepaliName: 'कमला नदी (धनुषा तथा सिराहा सीमा)',
    basinId: 'basin_kamala',
    basinName: 'Kamala & Jalad River Basin',
    lengthKm: 117,
    origin: 'Churia Hills near Sindhuli Garhi',
    confluence: 'Bagmati River tributary (Bihar, India)',
    keyDistricts: ['Dhanusha', 'Siraha', 'Sindhuli'],
    coordinates: [
      [27.15, 86.12], // Sindhuli Foothills
      [26.98, 86.08], // Ranibas DHM Station
      [26.91, 86.05], // Kamala Irrigation Barrage
      [26.82, 85.98], // Kalyanpur & Sabaila
      [26.74, 85.92], // East-West Highway Bridge
      [26.65, 85.88], // Janakpur Outskirts Plain Border
    ],
    dhmStationNumber: 'DHM-589',
    dhmStationName: 'Ranibas Hydrological Station',
    currentLevelMeters: 4.90,
    warningLevelMeters: 3.80,
    dangerLevelMeters: 4.50,
    highestHistoricalLevelMeters: 5.70,
    historicalRecordYear: 2019,
    dischargeCusecs: 112000,
    dischargeM3s: 3171,
    velocityMs: 2.6,
    status: 'danger',
    trend: 'rising',
    rateOfRiseCmPerHour: 11,
    rainfallLast24hMm: 148,
    barrageInfo: {
      name: 'Kamala Irrigation Weir',
      totalGates: 24,
      gatesOpen: 24,
      sluiceStatus: 'All gates open; western guide bund inspection underway',
    },
    downstreamSettlements: [
      {
        settlement: 'Mirchaiya, Siraha & Kalyanpur',
        nepaliSettlement: 'मिर्चैया, सिराहा तथा कल्याणपुर बस्ती',
        district: 'Siraha',
        leadTimeHours: 2.0,
        populationAtRisk: 26000,
        safeHaven: 'Lahan Elevated Stadium Safe Ground',
        safeHavenNepali: 'लहान रंगशाला सुरक्षित आश्रय',
      },
      {
        settlement: 'Sabaila & Dhanusadham Riparian Zone',
        nepaliSettlement: 'सबैला तथा धनुषाधाम तटीय क्षेत्र',
        district: 'Dhanusha',
        leadTimeHours: 2.4,
        populationAtRisk: 19500,
        safeHaven: 'Janakpur High Ground Mandir Hub',
        safeHavenNepali: 'जनकपुर राम मन्दिर सुरक्षित केन्द्र',
      },
    ],
    civilProtectionDirective: 'RIPARIAN FLOOD ADVISORY: Kamala River is flowing 0.4m above danger level. Flash flooding across postal road between Siraha and Dhanusha reported.',
    nepaliDirective: 'कमला नदी रानीबासमा खतरा विन्दु नाघेर ४.९० मिटर पुगेको छ। कल्याणपुर र सबैलाका तटीय बासिन्दाहरूलाई सचेत रहन आग्रह गरिन्छ।',
  },

  // ── 9. TINAU RIVER ────────────────────────────────────────────────────────
  {
    id: 'river_tinau',
    name: 'Tinau River',
    nepaliName: 'तिनाउ नदी (बुटवल तथा मर्चवार)',
    basinId: 'basin_tinau_rohini',
    basinName: 'Tinau & Rohini River Basin',
    lengthKm: 95,
    origin: 'Palpa Mahabharat Range Foothills',
    confluence: 'Dano River & border streams into India',
    keyDistricts: ['Rupandehi', 'Palpa'],
    coordinates: [
      [27.85, 83.52], // Palpa gorge descent
      [27.70, 83.46], // Butwal Flood Bridge DHM Station
      [27.62, 83.44], // Manigram & Tilottama
      [27.52, 83.42], // Gautam Buddha Airport Periphery
      [27.45, 83.40], // Siddharthanagar / Bhairahawa
      [27.42, 83.40], // Marchawar Southern Border
    ],
    dhmStationNumber: 'DHM-470',
    dhmStationName: 'Butwal Flood Bridge Station',
    currentLevelMeters: 5.60,
    warningLevelMeters: 4.50,
    dangerLevelMeters: 5.20,
    highestHistoricalLevelMeters: 6.80,
    historicalRecordYear: 2021,
    dischargeCusecs: 68000,
    dischargeM3s: 1925,
    velocityMs: 3.1,
    status: 'danger',
    trend: 'rising',
    rateOfRiseCmPerHour: 10,
    rainfallLast24hMm: 138,
    downstreamSettlements: [
      {
        settlement: 'Bhairahawa & Marchawar Border Belt',
        nepaliSettlement: 'भैरहवा तथा मर्चवार सीमावर्ती बस्ती',
        district: 'Rupandehi',
        leadTimeHours: 2.5,
        populationAtRisk: 18500,
        safeHaven: 'Butwal Hill Safe Staging Zone',
        safeHavenNepali: 'बुटवल पहाडी सुरक्षित शिविर',
      },
    ],
    civilProtectionDirective: 'FLASH GORGE FLOOD ALERT: Tinau River water level exceeds danger threshold. Butwal bridge traffic monitored. Low-lying Marchawar settlements advised to secure grain stocks.',
    nepaliDirective: 'तिनाउ नदी बुटवल बाढी पुलमा ५.६० मिटर पुगेको छ। बुटवल नदी किनार र मर्चवारका बासिन्दाहरू सतर्क रहनुहोस्।',
  },

  // ── 10. KANKAI RIVER ──────────────────────────────────────────────────────
  {
    id: 'river_kankai',
    name: 'Kankai River',
    nepaliName: 'कन्काई नदी (झापाको पवित्र बाढी नदी)',
    basinId: 'basin_kankai_mechi',
    basinName: 'Kankai & Mechi River Basin',
    lengthKm: 108,
    origin: 'Mai Khola / Ilam Hills',
    confluence: 'Mahananda River (India)',
    keyDistricts: ['Jhapa', 'Ilam'],
    coordinates: [
      [26.92, 87.94], // Ilam foothill descent
      [26.78, 87.91], // Kankai Dham Temple
      [26.66, 87.89], // Mainachuli DHM Station
      [26.58, 87.86], // Surunga & Shivaganj
      [26.48, 87.82], // Jhapa Southern Border
      [26.44, 87.81], // Indo-Nepal Border
    ],
    dhmStationNumber: 'DHM-795',
    dhmStationName: 'Mainachuli Hydrological Station',
    currentLevelMeters: 4.65,
    warningLevelMeters: 3.80,
    dangerLevelMeters: 4.40,
    highestHistoricalLevelMeters: 5.80,
    historicalRecordYear: 2017,
    dischargeCusecs: 84000,
    dischargeM3s: 2378,
    velocityMs: 2.7,
    status: 'danger',
    trend: 'rising',
    rateOfRiseCmPerHour: 12,
    rainfallLast24hMm: 165,
    downstreamSettlements: [
      {
        settlement: 'Kankai Municipality & Shivaganj',
        nepaliSettlement: 'कन्काई नगरपालिका तथा शिवगञ्ज',
        district: 'Jhapa',
        leadTimeHours: 1.8,
        populationAtRisk: 18200,
        safeHaven: 'Damak Multi-Purpose Relief Hub',
        safeHavenNepali: 'दमक बहुउद्देश्यीय राहत केन्द्र',
      },
    ],
    civilProtectionDirective: 'RIVERBANK SCOURING ALERT: Kankai at Mainachuli has crossed 4.4m danger level. Bank cutting along Surunga and Shivaganj paddy fields reported.',
    nepaliDirective: 'कन्काई नदी मैनाचुलीमा ४.६५ मिटर पुगेर खतराको तह नाघेको छ। सुरुङ्गा र शिवगञ्जका तटीय बासिन्दाहरू चनाखो रहनुहोस्।',
  },

  // ── 11. MOHANA RIVER ──────────────────────────────────────────────────────
  {
    id: 'river_mohana',
    name: 'Mohana River',
    nepaliName: 'मोहना नदी (कैलाली सीमावर्ती नदी)',
    basinId: 'basin_mohana',
    basinName: 'Mohana & Khutiya River Basin',
    lengthKm: 147,
    origin: 'Churia Foothills, Kailali',
    confluence: 'Karnali River Delta at Geruwa boundary',
    keyDistricts: ['Kailali'],
    coordinates: [
      [28.82, 80.64], // Churia origin
      [28.74, 80.61], // Attariya Plain
      [28.68, 80.59], // Dhangadhi Border Bridge DHM Station
      [28.58, 80.72], // Hasulia & Phoolbari
      [28.48, 80.95], // Bhajani Municipality Floodplain
      [28.40, 81.12], // Confluence with Geruwa / Karnali
    ],
    dhmStationNumber: 'DHM-240',
    dhmStationName: 'Dhangadhi Border Bridge Station',
    currentLevelMeters: 3.90,
    warningLevelMeters: 3.00,
    dangerLevelMeters: 3.60,
    highestHistoricalLevelMeters: 4.80,
    historicalRecordYear: 2021,
    dischargeCusecs: 42000,
    dischargeM3s: 1189,
    velocityMs: 2.1,
    status: 'danger',
    trend: 'rising',
    rateOfRiseCmPerHour: 9,
    rainfallLast24hMm: 122,
    downstreamSettlements: [
      {
        settlement: 'Bhajani & Lalbojhi Riparian Belt',
        nepaliSettlement: 'भजनी तथा लालबोझी तटीय क्षेत्र',
        district: 'Kailali',
        leadTimeHours: 1.6,
        populationAtRisk: 16800,
        safeHaven: 'Dhangadhi Higher Campus Safe Camp',
        safeHavenNepali: 'धनगढी उच्च क्याम्पस सुरक्षित शिविर',
      },
    ],
    civilProtectionDirective: 'BORDER INUNDATION WATCH: Mohana river overflowing banks along Postal Highway. Water stagnation in Bhajani. APF disaster squad deployed with inflatable boats.',
    nepaliDirective: 'मोहना नदी धनगढी सीमा पुलमा ३.९० मिटर पुगेको छ। भजनी क्षेत्रमा हुलाकी सडक जलमग्न भएकाले यातायात ठप्प भएको छ।',
  },

  // ── 12. MAHAKALI RIVER ────────────────────────────────────────────────────
  {
    id: 'river_mahakali',
    name: 'Mahakali River',
    nepaliName: 'महाकाली नदी (सुदूरपश्चिम सीमावर्ती नदी)',
    basinId: 'basin_mahakali',
    basinName: 'Mahakali River Basin',
    lengthKm: 223,
    origin: 'Greater Himalayas at Kalapani / Lipulekh',
    confluence: 'Ghaghara River (India)',
    keyDistricts: ['Kanchanpur', 'Dadeldhura', 'Baitadi'],
    coordinates: [
      [29.25, 80.25], // Jogbudha Valley exit
      [29.12, 80.18], // Parshuram Dham
      [29.02, 80.12], // Tanakpur Barrage
      [28.98, 80.10], // Bhimdatta (Mahendranagar) 4-Lane Bridge
      [28.90, 80.08], // Dodhara-Chandani Island Settlement
      [28.82, 80.10], // Banbasa Barrage
      [28.72, 80.24], // Kanchanpur Southern Plain
    ],
    dhmStationNumber: 'DHM-120',
    dhmStationName: 'Mahakali 4-Lane Bridge Station',
    currentLevelMeters: 6.70,
    warningLevelMeters: 5.50,
    dangerLevelMeters: 6.40,
    highestHistoricalLevelMeters: 8.20,
    historicalRecordYear: 2013,
    dischargeCusecs: 248000,
    dischargeM3s: 7022,
    velocityMs: 3.6,
    status: 'danger',
    trend: 'rising',
    rateOfRiseCmPerHour: 14,
    rainfallLast24hMm: 156,
    barrageInfo: {
      name: 'Banbasa & Tanakpur Barrage System',
      totalGates: 34,
      gatesOpen: 34,
      sluiceStatus: 'Four-wheel vehicle movement closed over Banbasa barrage',
    },
    downstreamSettlements: [
      {
        settlement: 'Dodhara-Chandani Island & Belauri',
        nepaliSettlement: 'दोधारा-चाँदनी टापु तथा बेलौरी',
        district: 'Kanchanpur',
        leadTimeHours: 1.8,
        populationAtRisk: 26000,
        safeHaven: 'Mahendranagar Stadium & High School',
        safeHavenNepali: 'महेन्द्रनगर रंगशाला सुरक्षित क्षेत्र',
      },
    ],
    civilProtectionDirective: 'BORDER BRIDGE EMERGENCY: Mahakali discharge exceeding 240,000 cusecs. Heavy current eroding four-lane bridge spur embankment in Bhimdatta. Dodhara-Chandani isolated.',
    nepaliDirective: 'महाकाली नदीमा बहाव २ लाख ४० हजार क्युसेक नाघेको छ। दोधारा-चाँदनी टापुका बासिन्दाहरूलाई तटबन्धबाट टाढा रहन प्रशासनले अनुरोध गरेको छ।',
  },
];

/**
 * Helper to get river status color
 */
export const getRiverStatusColor = (status: LiveRiverData['status']): string => {
  switch (status) {
    case 'extreme_flood':
      return '#EF4444'; // Bright Red
    case 'danger':
      return '#F97316'; // Vivid Orange
    case 'warning':
      return '#F59E0B'; // Amber
    case 'normal':
    default:
      return '#00F2FE'; // Electric Cyan
  }
};

/**
 * Synchronizes river telemetry and colors dynamically with active DHM gauges / scenarios.
 */
export const syncNepalRiversWithGauges = (
  rivers: LiveRiverData[],
  gauges: {
    dhmStationNumber?: string;
    river: string;
    currentLevelMeters: number;
    status: 'extreme_flood' | 'danger' | 'warning' | 'normal';
    trend: 'rising_rapidly' | 'rising' | 'steady' | 'receding';
    dischargeCusecs: number;
    rateOfRiseCmPerHour: number;
    sluiceGatesOpen?: number;
  }[]
): LiveRiverData[] => {
  if (!gauges || gauges.length === 0) return rivers;

  const dangerCount = gauges.filter((g) => g.status === 'danger' || g.status === 'extreme_flood').length;
  const warningCount = gauges.filter((g) => g.status === 'warning').length;
  const isMostlyNormal = dangerCount === 0 && warningCount <= 1;
  const isMostlyWarning = dangerCount === 0 && warningCount > 1;

  return rivers.map((river) => {
    // 1. Direct match by DHM station number or river name
    const rClean = river.name.toLowerCase().replace(' river', '').trim();
    const matched = gauges.find((g) => {
      if (g.dhmStationNumber && g.dhmStationNumber === river.dhmStationNumber) return true;
      const gClean = g.river.toLowerCase().replace(' river', '').trim();
      return gClean.includes(rClean) || rClean.includes(gClean);
    });

    if (matched) {
      return {
        ...river,
        currentLevelMeters: matched.currentLevelMeters,
        status: matched.status,
        trend: matched.trend,
        dischargeCusecs: matched.dischargeCusecs,
        rateOfRiseCmPerHour: matched.rateOfRiseCmPerHour,
        barrageInfo: river.barrageInfo
          ? {
              ...river.barrageInfo,
              gatesOpen: matched.sluiceGatesOpen ?? river.barrageInfo.gatesOpen,
            }
          : undefined,
      };
    }

    // 2. Proportional scenario scaling for unmonitored tributaries
    if (isMostlyNormal) {
      const lowLevel = Number((river.warningLevelMeters * 0.52).toFixed(2));
      return {
        ...river,
        currentLevelMeters: lowLevel,
        status: 'normal',
        trend: 'steady',
        rateOfRiseCmPerHour: 0,
        dischargeCusecs: Math.round(river.dischargeCusecs * 0.18),
        barrageInfo: river.barrageInfo
          ? { ...river.barrageInfo, gatesOpen: 4 }
          : undefined,
      };
    }

    if (isMostlyWarning) {
      const midLevel = Number(
        (river.warningLevelMeters + (river.dangerLevelMeters - river.warningLevelMeters) * 0.45).toFixed(2)
      );
      return {
        ...river,
        currentLevelMeters: midLevel,
        status: 'warning',
        trend: 'rising',
        rateOfRiseCmPerHour: 7,
        dischargeCusecs: Math.round(river.dischargeCusecs * 0.55),
        barrageInfo: river.barrageInfo
          ? { ...river.barrageInfo, gatesOpen: Math.round(river.barrageInfo.totalGates * 0.5) }
          : undefined,
      };
    }

    return river;
  });
};

