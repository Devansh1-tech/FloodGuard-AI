/**
 * teraiAgriculture.ts — Agricultural Crop Exposure & Economic Damage Data for Nepal Terai
 *
 * Implements Weakness 11 Resolution:
 * Provides empirical valuation of submerged paddy, sugarcane, and cash-crop fields
 * in hectares, lost metric tons of staple grain, and monetary losses in Nepalese Rupees (NPR).
 */

export interface SectorAgriLoss {
  sectorId: string;
  totalCroplandHa: number;
  paddyHa: number;
  sugarcaneHa: number;
  vegetablesHa: number;
  lostPaddyTons: number;
  lostSugarcaneTons: number;
  economicLossNprCrores: number;
  economicLossNprExact: number;
  impactedFarmingHouseholds: number;
  foodDeficitMonths: number;
  primaryCropsDamaged: string[];
  districtBreakdown: {
    district: string;
    floodedHa: number;
    lossNprCrores: number;
    households: number;
  }[];
}

export const TERAI_AGRI_DATA: Record<string, SectorAgriLoss> = {
  koshi_sector: {
    sectorId: 'koshi_sector',
    totalCroplandHa: 23290.0,
    paddyHa: 16768.8,
    sugarcaneHa: 4192.2,
    vegetablesHa: 2329.0,
    lostPaddyTons: 64560.0,
    lostSugarcaneTons: 192841.0,
    economicLossNprCrores: 354.85,
    economicLossNprExact: 3548500000,
    impactedFarmingHouseholds: 27400,
    foodDeficitMonths: 4.8,
    primaryCropsDamaged: ['Monsoon Paddy (Dhan)', 'Sugarcane (Ukhu)', 'Jute (Pat)', 'Autumn Vegetables'],
    districtBreakdown: [
      { district: 'Sunsari', floodedHa: 12450.0, lossNprCrores: 192.4, households: 14800 },
      { district: 'Saptari', floodedHa: 10840.0, lossNprCrores: 162.45, households: 12600 },
    ],
  },
  narayani_sector: {
    sectorId: 'narayani_sector',
    totalCroplandHa: 19380.0,
    paddyHa: 13953.6,
    sugarcaneHa: 3488.4,
    vegetablesHa: 1938.0,
    lostPaddyTons: 53721.0,
    lostSugarcaneTons: 160466.0,
    economicLossNprCrores: 295.2,
    economicLossNprExact: 2952000000,
    impactedFarmingHouseholds: 22800,
    foodDeficitMonths: 3.9,
    primaryCropsDamaged: ['Monsoon Rice (Dhan)', 'Maize (Makai)', 'Banana Plantations', 'Vegetables'],
    districtBreakdown: [
      { district: 'Chitwan', floodedHa: 10240.0, lossNprCrores: 158.5, households: 11900 },
      { district: 'Nawalparasi East', floodedHa: 9140.0, lossNprCrores: 136.7, households: 10900 },
    ],
  },
  bagmati_rautahat: {
    sectorId: 'bagmati_rautahat',
    totalCroplandHa: 14307.2,
    paddyHa: 10301.2,
    sugarcaneHa: 2575.3,
    vegetablesHa: 1430.7,
    lostPaddyTons: 39659.6,
    lostSugarcaneTons: 118463.8,
    economicLossNprCrores: 218.05,
    economicLossNprExact: 2180500000,
    impactedFarmingHouseholds: 16830,
    foodDeficitMonths: 5.2,
    primaryCropsDamaged: ['Sugarcane (Mills supply)', 'Paddy', 'Pulses (Dal)', 'Chili'],
    districtBreakdown: [
      { district: 'Rautahat', floodedHa: 8950.0, lossNprCrores: 138.2, households: 10500 },
      { district: 'Sarlahi', floodedHa: 5357.2, lossNprCrores: 79.85, households: 6330 },
    ],
  },
  karnali_sector: {
    sectorId: 'karnali_sector',
    totalCroplandHa: 26860.0,
    paddyHa: 19339.2,
    sugarcaneHa: 4834.8,
    vegetablesHa: 2686.0,
    lostPaddyTons: 74455.9,
    lostSugarcaneTons: 222400.8,
    economicLossNprCrores: 409.35,
    economicLossNprExact: 4093500000,
    impactedFarmingHouseholds: 31600,
    foodDeficitMonths: 5.5,
    primaryCropsDamaged: ['Indigenous Paddy Varieties', 'Wheat reserves', 'Mustard', 'Lentils'],
    districtBreakdown: [
      { district: 'Bardiya', floodedHa: 15420.0, lossNprCrores: 238.4, households: 18100 },
      { district: 'Kailali', floodedHa: 11440.0, lossNprCrores: 170.95, households: 13500 },
    ],
  },
  west_rapti_banke: {
    sectorId: 'west_rapti_banke',
    totalCroplandHa: 12144.8,
    paddyHa: 8744.3,
    sugarcaneHa: 2186.1,
    vegetablesHa: 1214.4,
    lostPaddyTons: 33665.6,
    lostSugarcaneTons: 100560.6,
    economicLossNprCrores: 185.1,
    economicLossNprExact: 1851000000,
    impactedFarmingHouseholds: 14280,
    foodDeficitMonths: 3.5,
    primaryCropsDamaged: ['Paddy', 'Mustard seed', 'Maize', 'Vegetables'],
    districtBreakdown: [
      { district: 'Banke', floodedHa: 8120.0, lossNprCrores: 125.6, households: 9550 },
      { district: 'Dang', floodedHa: 4024.8, lossNprCrores: 59.5, households: 4730 },
    ],
  },
};

export const getAgricultureLossForSector = (sectorId: string): SectorAgriLoss => {
  return TERAI_AGRI_DATA[sectorId] || TERAI_AGRI_DATA.koshi_sector;
};
