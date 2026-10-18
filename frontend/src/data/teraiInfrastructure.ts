/**
 * teraiInfrastructure.ts — Terai Health Infrastructure & Demographic Exposure Data.
 *
 * Integrated with Google Maps JavaScript API for:
 * - Hospital & Health Post operational status (Submerged vs Operational).
 * - Population exposure across the 21 Terai districts (WorldPop 100m model).
 * - Emergency contacts, bed capacities, and ambulance dispatch nodes.
 */

export interface HospitalFacility {
  id: string;
  name: string;
  district: string;
  basin: string;
  coords: [number, number]; // [lat, lng]
  beds: number;
  status: string;
  isFlooded: boolean;
  type: string;
  phone: string;
  nearestSafeHaven: string;
}

export interface DistrictDemographics {
  district: string;
  basin: string;
  totalPopulation: number;
  atRiskPopulation: number;
  inundatedAreaKm2: number;
  hospitalsCount: number;
  sheltersCount: number;
}

export const TERAI_HOSPITALS: HospitalFacility[] = [
  {
    id: 'hosp_koshi_01',
    name: 'Koshi Hospital (Biratnagar)',
    district: 'Morang',
    basin: 'Eastern Terai',
    coords: [26.4525, 87.2718],
    beds: 350,
    status: 'OPERATIONAL (High Patient Surge)',
    isFlooded: false,
    type: 'Provincial Referral Center',
    phone: '+977-21-525252',
    nearestSafeHaven: 'Duhabi Elevated College Campus',
  },
  {
    id: 'hosp_hanumannagar_02',
    name: 'Hanumannagar Primary Health Center',
    district: 'Saptari',
    basin: 'Eastern Terai',
    coords: [26.5400, 86.8200],
    beds: 30,
    status: 'SUBMERGED / INOPERABLE (Water Depth 1.4m)',
    isFlooded: true,
    type: 'Primary Health Post',
    phone: '+977-31-520111',
    nearestSafeHaven: 'Hanumannagar Higher Secondary School',
  },
  {
    id: 'hosp_bhantabari_03',
    name: 'Bhantabari Border Health Post',
    district: 'Sunsari',
    basin: 'Eastern Terai',
    coords: [26.5100, 86.8600],
    beds: 20,
    status: 'SUBMERGED / INOPERABLE (Koshi Tailwater Inundation)',
    isFlooded: true,
    type: 'Border Health Post',
    phone: '+977-25-560120',
    nearestSafeHaven: 'Barahachhetra High Ridge Camp',
  },
  {
    id: 'hosp_janakpur_04',
    name: 'Janakpur Provincial Hospital',
    district: 'Dhanusa',
    basin: 'Central Terai',
    coords: [26.7288, 85.9244],
    beds: 250,
    status: 'OPERATIONAL (Active Emergency Ward)',
    isFlooded: false,
    type: 'Provincial Zonal Hospital',
    phone: '+977-41-520133',
    nearestSafeHaven: 'Ram Mandir High Ground Evacuation Hub',
  },
  {
    id: 'hosp_gaur_05',
    name: 'Gaur District Hospital',
    district: 'Rautahat',
    basin: 'Central Terai',
    coords: [26.7610, 85.2780],
    beds: 80,
    status: 'WATERLOGGED (Ground Floor Submerged)',
    isFlooded: true,
    type: 'District Hospital',
    phone: '+977-55-520144',
    nearestSafeHaven: 'Chandranigahapur Highway High Campus',
  },
  {
    id: 'hosp_bharatpur_06',
    name: 'Bharatpur Central Hospital',
    district: 'Chitwan',
    basin: 'Central Terai',
    coords: [27.6833, 84.4333],
    beds: 600,
    status: 'OPERATIONAL (Regional Emergency Trauma Hub)',
    isFlooded: false,
    type: 'Tertiary Referral Center',
    phone: '+977-56-524830',
    nearestSafeHaven: 'Bharatpur Elevated Safe Haven Campus',
  },
  {
    id: 'hosp_bheri_07',
    name: 'Bheri Provincial Hospital (Nepalgunj)',
    district: 'Banke',
    basin: 'Western Terai',
    coords: [28.0536, 81.6186],
    beds: 300,
    status: 'OPERATIONAL (Western Flood Coordination)',
    isFlooded: false,
    type: 'Regional Referral Hospital',
    phone: '+977-81-520120',
    nearestSafeHaven: 'Kohalpur Evacuation & Relief Hub',
  },
  {
    id: 'hosp_seti_08',
    name: 'Seti Provincial Hospital (Dhangadhi)',
    district: 'Kailali',
    basin: 'Far-Western Terai',
    coords: [28.6942, 80.5894],
    beds: 200,
    status: 'OPERATIONAL (Far-Western Hub)',
    isFlooded: false,
    type: 'Provincial Hospital',
    phone: '+977-91-521122',
    nearestSafeHaven: 'Attariya High Ground Shelter Center',
  },
];

export const TERAI_DISTRICT_STATS: DistrictDemographics[] = [
  { district: 'Jhapa', basin: 'Eastern Terai', totalPopulation: 904000, atRiskPopulation: 34500, inundatedAreaKm2: 42.1, hospitalsCount: 18, sheltersCount: 12 },
  { district: 'Morang', basin: 'Eastern Terai', totalPopulation: 1148000, atRiskPopulation: 82000, inundatedAreaKm2: 98.4, hospitalsCount: 26, sheltersCount: 16 },
  { district: 'Sunsari', basin: 'Eastern Terai', totalPopulation: 927000, atRiskPopulation: 76400, inundatedAreaKm2: 108.0, hospitalsCount: 22, sheltersCount: 14 },
  { district: 'Saptari', basin: 'Eastern Terai', totalPopulation: 706000, atRiskPopulation: 58200, inundatedAreaKm2: 74.2, hospitalsCount: 15, sheltersCount: 11 },
  { district: 'Siraha', basin: 'Eastern Terai', totalPopulation: 739000, atRiskPopulation: 32000, inundatedAreaKm2: 36.8, hospitalsCount: 14, sheltersCount: 9 },
  { district: 'Dhanusa', basin: 'Central Terai', totalPopulation: 865000, atRiskPopulation: 49000, inundatedAreaKm2: 54.2, hospitalsCount: 19, sheltersCount: 13 },
  { district: 'Mahottari', basin: 'Central Terai', totalPopulation: 706000, atRiskPopulation: 38500, inundatedAreaKm2: 41.5, hospitalsCount: 12, sheltersCount: 8 },
  { district: 'Sarlahi', basin: 'Central Terai', totalPopulation: 860000, atRiskPopulation: 44200, inundatedAreaKm2: 48.7, hospitalsCount: 16, sheltersCount: 10 },
  { district: 'Rautahat', basin: 'Central Terai', totalPopulation: 809000, atRiskPopulation: 67800, inundatedAreaKm2: 82.4, hospitalsCount: 13, sheltersCount: 9 },
  { district: 'Bara', basin: 'Central Terai', totalPopulation: 763000, atRiskPopulation: 29400, inundatedAreaKm2: 31.0, hospitalsCount: 15, sheltersCount: 8 },
  { district: 'Parsa', basin: 'Central Terai', totalPopulation: 654000, atRiskPopulation: 22100, inundatedAreaKm2: 24.5, hospitalsCount: 21, sheltersCount: 11 },
  { district: 'Chitawan', basin: 'Central Terai', totalPopulation: 720000, atRiskPopulation: 28400, inundatedAreaKm2: 38.6, hospitalsCount: 28, sheltersCount: 15 },
  { district: 'Rupandehi', basin: 'Western Terai', totalPopulation: 1121000, atRiskPopulation: 32000, inundatedAreaKm2: 34.2, hospitalsCount: 31, sheltersCount: 18 },
  { district: 'Kapilbastu', basin: 'Western Terai', totalPopulation: 686000, atRiskPopulation: 24500, inundatedAreaKm2: 28.0, hospitalsCount: 14, sheltersCount: 9 },
  { district: 'Banke', basin: 'Western Terai', totalPopulation: 608000, atRiskPopulation: 52100, inundatedAreaKm2: 64.8, hospitalsCount: 20, sheltersCount: 12 },
  { district: 'Bardiya', basin: 'Western Terai', totalPopulation: 460000, atRiskPopulation: 38900, inundatedAreaKm2: 52.0, hospitalsCount: 11, sheltersCount: 8 },
  { district: 'Kailali', basin: 'Far-Western Terai', totalPopulation: 904000, atRiskPopulation: 41200, inundatedAreaKm2: 49.3, hospitalsCount: 22, sheltersCount: 14 },
  { district: 'Kanchanpur', basin: 'Far-Western Terai', totalPopulation: 513000, atRiskPopulation: 26500, inundatedAreaKm2: 32.1, hospitalsCount: 14, sheltersCount: 10 },
];
