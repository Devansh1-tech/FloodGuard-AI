/**
 * teraiFloodCorridors.ts — High-Resolution Sentinel-1 SAR Flood Corridors for Nepal Terai.
 *
 * Detailed geospatial polygon corridors for all 11 major river basins:
 * 1. Saptakoshi Braided Deluge Corridor (Sunsari / Saptari)
 * 2. Koshi Eastern Embankment & Inaruwa-Bhantabari Overflow
 * 3. Morang Keshalya & Singhiya Floodplains (Biratnagar Lowlands)
 * 4. Bagmati & Lalbakeya Deluge Corridor (Rautahat - Gaur / Pipra / Sarlahi)
 * 5. Dhanusha & Siraha Jalad-Kamala Flood Basin (Janakpur Outskirts)
 * 6. Narayani River Lowland Flood Corridor (Chitwan Madi & Meghauli / Nawalparasi)
 * 7. Tinau River & Bhairahawa Marchawar Plains (Rupandehi)
 * 8. West Rapti Floodplain Corridor (Banke - Holiya / Betahani / Narainapur)
 * 9. Babai River Inundation Corridor (Bardiya - Gulariya & Rajapur)
 * 10. Karnali Delta & Mohana Floodline (Kailali - Tikapur / Dhangadhi)
 * 11. Mahakali River Floodplain & Dodhara-Chandani (Kanchanpur)
 */

export interface FloodCorridorData {
  id: string;
  name: string;
  nepaliName: string;
  basin: string;
  districts: string[];
  severity: 'critical' | 'severe' | 'moderate';
  inundatedAreaKm2: number;
  waterDepthRange: string;
  deltaDb: number;
  otsuThreshold: number;
  keySubmergedCities: string[];
  keyVillages: string[];
  polygon: [number, number][]; // [lat, lng]
  primaryHazards: string[];
  rescuePriority: 'immediate_apf_boats' | 'high_clearance_vehicles' | 'dyke_monitoring';
}

export const TERAI_FLOOD_CORRIDORS: FloodCorridorData[] = [
  {
    id: 'corridor_koshi_saptakoshi',
    name: 'Saptakoshi Braided River Deluge Corridor',
    nepaliName: 'सप्तकोशी नदी तटीय बाढी क्षेत्र',
    basin: 'Eastern Terai (Saptakoshi Basin)',
    districts: ['Sunsari', 'Saptari'],
    severity: 'critical',
    inundatedAreaKm2: 142.4,
    waterDepthRange: '1.5m – 2.8m',
    deltaDb: -9.4,
    otsuThreshold: -15.2,
    keySubmergedCities: ['Inaruwa / Prakashpur', 'Rajbiraj / Hanumannagar'],
    keyVillages: [
      'Prakashpur Riverbank Ward 4',
      'Mahendranagar Sunsari Tola',
      'Hanumannagar Kankalini Ward 1',
      'Tilathi Koiladi Border Settlement',
      'Gobargadha Isolated Island Tola',
    ],
    polygon: [
      [26.89, 87.16], [26.85, 87.14], [26.80, 87.10], [26.74, 87.05],
      [26.68, 87.01], [26.62, 86.97], [26.56, 86.94], [26.51, 86.92],
      [26.50, 86.92], [26.50, 86.85], [26.51, 86.80], [26.52, 86.78],
      [26.55, 86.81], [26.60, 86.85], [26.67, 86.90], [26.73, 86.94],
      [26.80, 87.01], [26.86, 87.08], [26.90, 87.14], [26.89, 87.16]
    ],
    primaryHazards: [
      'Violent glacial runoff surges through Koshi Barrage sluices',
      'Eastern embankment sand seepage at Prakashpur',
      'Island settlements completely cut off by 2.5m standing water',
    ],
    rescuePriority: 'immediate_apf_boats',
  },
  {
    id: 'corridor_koshi_eastern_embankment',
    name: 'Koshi Eastern Embankment & Inaruwa-Bhantabari Overflow',
    nepaliName: 'कोशी पूर्वी तटबन्ध तथा भन्टाबारी डुबान क्षेत्र',
    basin: 'Eastern Terai (Koshi River)',
    districts: ['Sunsari'],
    severity: 'severe',
    inundatedAreaKm2: 48.2,
    waterDepthRange: '1.1m – 2.1m',
    deltaDb: -8.6,
    otsuThreshold: -15.0,
    keySubmergedCities: ['Inaruwa', 'Bhantabari Border'],
    keyVillages: ['Bhantabari Customs Border Tola', 'Harinagar Agricultural Ward 2'],
    polygon: [
      [26.65, 86.98], [26.62, 87.12], [26.58, 87.18], [26.52, 87.16],
      [26.48, 87.10], [26.49, 86.95], [26.54, 86.93], [26.65, 86.98]
    ],
    primaryHazards: [
      'Postal highway cut-off at Bhantabari culvert',
      'Inundation of paddy farmland and poultry complexes',
    ],
    rescuePriority: 'high_clearance_vehicles',
  },
  {
    id: 'corridor_morang_keshalya',
    name: 'Morang Keshalya & Singhiya River Floodplains',
    nepaliName: 'मोरङ केसलिया तथा सिंघिया खोला बाढी क्षेत्र',
    basin: 'Eastern Terai (Morang Basin)',
    districts: ['Morang'],
    severity: 'severe',
    inundatedAreaKm2: 38.6,
    waterDepthRange: '1.0m – 1.8m',
    deltaDb: -8.2,
    otsuThreshold: -15.1,
    keySubmergedCities: ['Biratnagar Metropolitan Hub'],
    keyVillages: [
      'Rani Border Custom Town',
      'Jatuwa & Mills Area Ward 12',
      'Katahari Agricultural Settlement',
    ],
    polygon: [
      [26.44, 87.24], [26.47, 87.25], [26.52, 87.28], [26.50, 87.32],
      [26.44, 87.31], [26.44, 87.27], [26.44, 87.24]
    ],
    primaryHazards: [
      'Singhiya river spillover into Biratnagar southern wards',
      'Biratnagar custom cargo yard waterlogging',
    ],
    rescuePriority: 'high_clearance_vehicles',
  },
  {
    id: 'corridor_bagmati_lalbakeya',
    name: 'Bagmati & Lalbakeya Deluge Corridor (Gaur Deluge)',
    nepaliName: 'बागमती तथा लालबकैया नदी बाढी करिडोर (गौर डुबान)',
    basin: 'Central Terai (Bagmati & Lalbakeya)',
    districts: ['Rautahat', 'Sarlahi'],
    severity: 'critical',
    inundatedAreaKm2: 89.4,
    waterDepthRange: '1.8m – 3.2m',
    deltaDb: -11.2,
    otsuThreshold: -15.4,
    keySubmergedCities: ['Gaur Municipality', 'Malangwa Border'],
    keyVillages: [
      'Gaur Border Customs Chowk',
      'Bhanu Chowk Central Market',
      'Pipra Rajdevi Tola',
      'Brahmapuri Lowland Settlement',
      'Kaudena Village Ward 3',
    ],
    polygon: [
      [27.15, 85.39], [27.08, 85.36], [27.01, 85.33], [26.94, 85.31],
      [26.87, 85.29], [26.80, 85.27], [26.76, 85.26], [26.76, 85.31],
      [26.78, 85.35], [26.85, 85.38], [26.92, 85.40], [27.00, 85.42],
      [27.08, 85.43], [27.16, 85.42], [27.15, 85.39]
    ],
    primaryHazards: [
      'Gaur town submerged under 2.4m water behind southern ring dam',
      'Lalbakeya western earthen dyke breach',
      'Zero natural drainage gradient toward Indian border',
    ],
    rescuePriority: 'immediate_apf_boats',
  },
  {
    id: 'corridor_dhanusha_kamala',
    name: 'Kamala & Jalad River Basin Corridor',
    nepaliName: 'कमला तथा जलाद नदी बाढी क्षेत्र',
    basin: 'Central-Eastern Terai (Kamala Basin)',
    districts: ['Dhanusha', 'Siraha'],
    severity: 'severe',
    inundatedAreaKm2: 52.8,
    waterDepthRange: '1.2m – 2.2m',
    deltaDb: -8.9,
    otsuThreshold: -15.3,
    keySubmergedCities: ['Janakpurdham Outskirts', 'Siraha / Lahan'],
    keyVillages: [
      'Kuwa & Subarna Tola Ward 23',
      'Basbitti Rural Ward 4',
      'Siraha Southern Border Tola',
      'Kalyanpur Kamala Riverside Settlement',
    ],
    polygon: [
      [26.78, 85.86], [26.75, 85.90], [26.72, 85.95], [26.68, 85.98],
      [26.67, 85.95], [26.67, 85.88], [26.70, 85.84], [26.78, 85.86]
    ],
    primaryHazards: [
      'Kamala river embankment washout near Kalyanpur',
      'Janakpur historical ponds overflow into surrounding agricultural wards',
    ],
    rescuePriority: 'high_clearance_vehicles',
  },
  {
    id: 'corridor_narayani_chitwan',
    name: 'Narayani River Lowland Corridor (Madi & Meghauli)',
    nepaliName: 'नारायणी नदी तटीय क्षेत्र (माडी तथा मेघौली)',
    basin: 'Central Terai (Narayani Basin)',
    districts: ['Chitwan', 'Nawalpur (Nawalparasi East)'],
    severity: 'critical',
    inundatedAreaKm2: 67.5,
    waterDepthRange: '1.6m – 2.9m',
    deltaDb: -9.8,
    otsuThreshold: -15.5,
    keySubmergedCities: ['Bharatpur / Madi Valley', 'Kawasoti / Danda'],
    keyVillages: [
      'Madi Riverine Basin Tola',
      'Meghauli Lowland Safari Ward',
      'Prasauni Wetland Settlement',
    ],
    polygon: [
      [27.712, 84.428], [27.708, 84.360], [27.702, 84.310], [27.695, 84.270],
      [27.682, 84.225], [27.665, 84.185], [27.645, 84.150], [27.615, 84.135],
      [27.575, 84.155], [27.558, 84.180], [27.575, 84.215], [27.605, 84.230],
      [27.632, 84.245], [27.665, 84.275], [27.678, 84.320], [27.688, 84.370],
      [27.698, 84.422], [27.712, 84.428]
    ],
    primaryHazards: [
      'Narayani river swelling over 8.4m danger level at Devghat',
      'Madi valley flash floods trapping riverside eco-residences and livestock',
    ],
    rescuePriority: 'immediate_apf_boats',
  },
  {
    id: 'corridor_tinau_rupandehi',
    name: 'Tinau & Rohini River Marchawar Plains',
    nepaliName: 'तिनाउ तथा रोहिणी नदी मर्चवार डुबान क्षेत्र',
    basin: 'Western Terai (Tinau & Rohini Basin)',
    districts: ['Rupandehi'],
    severity: 'severe',
    inundatedAreaKm2: 36.4,
    waterDepthRange: '0.9m – 1.8m',
    deltaDb: -8.1,
    otsuThreshold: -15.0,
    keySubmergedCities: ['Siddharthanagar / Bhairahawa', 'Butwal Outskirts'],
    keyVillages: [
      'Bhairahawa Airport Periphery Ward 3',
      'Marchawar Southern Border Tola',
      'Kotahimai Agricultural Settlement',
    ],
    polygon: [
      [27.58, 83.45], [27.52, 83.43], [27.45, 83.40], [27.42, 83.40],
      [27.42, 83.44], [27.44, 83.48], [27.48, 83.52], [27.56, 83.50],
      [27.58, 83.45]
    ],
    primaryHazards: [
      'Marchawar southern lowland water stagnation due to cross-border bunds',
      'Gautam Buddha International Airport perimeter drainage backflow',
    ],
    rescuePriority: 'high_clearance_vehicles',
  },
  {
    id: 'corridor_west_rapti_banke',
    name: 'West Rapti Floodplain Corridor (Holiya / Narainapur)',
    nepaliName: 'पश्चिम राप्ती नदी बाढी करिडोर (होलिया तथा नरैनापुर)',
    basin: 'Western Terai (West Rapti Basin)',
    districts: ['Banke'],
    severity: 'critical',
    inundatedAreaKm2: 84.3,
    waterDepthRange: '1.7m – 3.0m',
    deltaDb: -10.4,
    otsuThreshold: -15.4,
    keySubmergedCities: ['Nepalgunj Lowland Outskirts', 'Kohalpur Base'],
    keyVillages: [
      'Holiya Riverine Tola Ward 2',
      'Betahani Lowland Settlement',
      'Narainapur Southern Border Ward 4',
      'Kamdi Riverside Tola',
    ],
    polygon: [
      [28.12, 81.90], [28.08, 81.82], [28.02, 81.74], [27.96, 81.65],
      [27.90, 81.58], [27.84, 81.52], [27.82, 81.58], [27.88, 81.68],
      [27.95, 81.78], [28.02, 81.88], [28.08, 81.96], [28.12, 81.90]
    ],
    primaryHazards: [
      'Laxmanpur Barrage backwater inundating Holiya and Narainapur',
      'Heavy silt sedimentation burying crops under 40cm mud',
    ],
    rescuePriority: 'immediate_apf_boats',
  },
  {
    id: 'corridor_babai_bardiya',
    name: 'Babai River Inundation Corridor (Gulariya & Rajapur)',
    nepaliName: 'बबई नदी बाढी करिडोर (गुलरिया तथा राजापुर)',
    basin: 'Mid-Western Terai (Babai Basin)',
    districts: ['Bardiya'],
    severity: 'critical',
    inundatedAreaKm2: 73.1,
    waterDepthRange: '1.4m – 2.7m',
    deltaDb: -9.5,
    otsuThreshold: -15.3,
    keySubmergedCities: ['Gulariya Municipality', 'Rajapur Island'],
    keyVillages: [
      'Ghurpetan Lowland Ward 4',
      'Thakurdwara Riverbank Tola',
      'Rajapur Delta Agricultural Ward 1',
      'Badhaiyatal Border Settlement',
    ],
    polygon: [
      [28.32, 81.42], [28.25, 81.36], [28.18, 81.30], [28.12, 81.25],
      [28.10, 81.31], [28.16, 81.38], [28.23, 81.44], [28.30, 81.48],
      [28.32, 81.42]
    ],
    primaryHazards: [
      'Babai bridge approach road erosion isolating Gulariya district headquarters',
      'Rajapur island cut off between Karnali and Geruwa channels',
    ],
    rescuePriority: 'immediate_apf_boats',
  },
  {
    id: 'corridor_karnali_kailali',
    name: 'Karnali Delta & Mohana Floodline (Tikapur / Bhajani)',
    nepaliName: 'कर्णाली डेल्टा तथा मोहना नदी बाढी क्षेत्र (टीकापुर र भजनी)',
    basin: 'Far-Western Terai (Karnali & Mohana Basin)',
    districts: ['Kailali'],
    severity: 'critical',
    inundatedAreaKm2: 91.2,
    waterDepthRange: '1.6m – 3.1m',
    deltaDb: -10.1,
    otsuThreshold: -15.4,
    keySubmergedCities: ['Dhangadhi Sub-Metropolitan', 'Tikapur Lowlands'],
    keyVillages: [
      'Bhajani Municipality Ward 3 & 8',
      'Tikapur Riverside Settlement',
      'Mohana Riverbank Tola Ward 7',
      'Hasulia Border Settlement',
    ],
    polygon: [
      [28.60, 81.22], [28.52, 81.18], [28.44, 81.14], [28.36, 81.10],
      [28.34, 81.16], [28.40, 81.22], [28.48, 81.28], [28.56, 81.30],
      [28.60, 81.22]
    ],
    primaryHazards: [
      'Simultaneous overflow of Karnali and Mohana drowning Bhajani basin',
      'Postal highway submerged over 14 kilometers',
    ],
    rescuePriority: 'immediate_apf_boats',
  },
  {
    id: 'corridor_mahakali_kanchanpur',
    name: 'Mahakali River Floodplain & Dodhara-Chandani',
    nepaliName: 'महाकाली नदी बाढी करिडोर (दोधारा-चाँदनी)',
    basin: 'Far-Western Terai (Mahakali Basin)',
    districts: ['Kanchanpur'],
    severity: 'severe',
    inundatedAreaKm2: 44.8,
    waterDepthRange: '1.2m – 2.4m',
    deltaDb: -8.8,
    otsuThreshold: -15.1,
    keySubmergedCities: ['Bhimdatta / Mahendranagar', 'Dodhara-Chandani'],
    keyVillages: [
      'Dodhara-Chandani Island Settlement',
      'Belauri Border Ward 2',
      'Shuklaphanta Grassland Outskirts',
    ],
    polygon: [
      [28.98, 80.12], [28.92, 80.10], [28.84, 80.14], [28.76, 80.20],
      [28.72, 80.28], [28.70, 80.34], [28.76, 80.32], [28.82, 80.26],
      [28.90, 80.20], [28.98, 80.18], [28.98, 80.12]
    ],
    primaryHazards: [
      'Mahakali discharge exceeding 450,000 cusecs',
      'Four-lane bridge access spur erosion',
    ],
    rescuePriority: 'immediate_apf_boats',
  },
];
