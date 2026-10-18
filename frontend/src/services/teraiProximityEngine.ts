/**
 * teraiProximityEngine.ts — Geospatial k-NN Proximity & Site Suitability Engine for Nepal Terai.
 *
 * Implements Stage 5.7 (Point 8):
 * 1. Haversine distance and bearing calculations.
 * 2. k-NN spatial proximity scanner around flooded settlement centroids.
 * 3. Multi-criteria site suitability ranking (Elevation, WASH, Concrete Structure, HLZ Helipad).
 * 4. Sphere Standards emergency refugee camp deployment calculator.
 */

import { SafeHavenFacility, TERAI_SAFE_HAVENS } from '@/data/teraiSafeHavens';

export interface ProximityMatch {
  haven: SafeHavenFacility;
  distanceKm: number;
  bearingDegrees: number;
  compassDirection: string;
  elevationGainMeters: number;
  remainingCapacity: number;
  occupancyPercent: number;
  proximityZone: 'immediate_walkable' | 'intermediate_tactical' | 'regional_strategic';
  estimatedTransitTimeMinutes: {
    walking: number; // 4 km/h pace
    tractor: number; // 20 km/h pace
    convoyTruck: number; // 45 km/h pace
  };
  compositeScore: number; // 0 - 100 score factoring distance + site suitability
}

export interface RefugeeCampManifest {
  evacueeHeadcount: number;
  requiredLandAreaSqMeters: number; // 45m² / person (Sphere standard)
  coveredLivingAreaSqMeters: number; // 3.5m² / person
  familyTentsCount: number; // 5 persons / tent (16m² standard)
  latrinesRequired: number; // 1 per 20 persons (gender-segregated)
  waterDailyLiters: number; // 15 Liters / person / day (Sphere WASH standard)
  waterBladdersT11Count: number; // 11,000L pillow tanks
  communalHandwashTaps: number; // 1 tap per 100 persons
  medicalTriageTents: number; // 1 per 1,500 persons
  powerMicrogridsKva: number; // Emergency lighting & medical power
  wasteDisposalPitsCount: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. GEOSPATIAL HAVERSINE DISTANCE & BEARING
// ─────────────────────────────────────────────────────────────────────────────
export const calculateHaversineDistanceKm = (
  coords1: [number, number],
  coords2: [number, number]
): number => {
  const [lat1, lon1] = coords1;
  const [lat2, lon2] = coords2;

  const R = 6371; // Earth radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
};

export const calculateCompassBearing = (
  coords1: [number, number],
  coords2: [number, number]
): { degrees: number; cardinal: string } => {
  const [lat1, lon1] = coords1.map((deg) => (deg * Math.PI) / 180);
  const [lat2, lon2] = coords2.map((deg) => (deg * Math.PI) / 180);

  const dLon = lon2 - lon1;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  let brng = (Math.atan2(y, x) * 180) / Math.PI;
  brng = (brng + 360) % 360;

  const cardinals = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N'];
  const index = Math.round(brng / 45);

  return {
    degrees: Math.round(brng),
    cardinal: cardinals[index],
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. k-NN PROXIMITY SCANNER & SITE SUITABILITY ENGINE
// ─────────────────────────────────────────────────────────────────────────────
export const findNearbySafeHavens = (
  centerCoords: [number, number],
  centerElevationMeters: number = 80,
  maxRadiusKm: number = 40,
  filters?: {
    minCapacity?: number;
    requiresHelipad?: boolean;
    districtFilter?: string;
  }
): ProximityMatch[] => {
  const matches: ProximityMatch[] = [];

  TERAI_SAFE_HAVENS.forEach((haven) => {
    // District filter
    if (filters?.districtFilter && filters.districtFilter !== 'all') {
      if (haven.district.toLowerCase() !== filters.districtFilter.toLowerCase()) {
        return;
      }
    }

    // Capacity filter
    if (filters?.minCapacity && haven.totalCapacity < filters.minCapacity) {
      return;
    }

    // Helipad filter
    if (filters?.requiresHelipad && !haven.hasHelipad) {
      return;
    }

    const distanceKm = calculateHaversineDistanceKm(centerCoords, haven.coords);

    if (distanceKm <= maxRadiusKm) {
      const bearing = calculateCompassBearing(centerCoords, haven.coords);
      const elevationGainMeters = Math.max(0, haven.elevationMeters - centerElevationMeters);
      const remainingCapacity = Math.max(0, haven.totalCapacity - haven.currentOccupancy);
      const occupancyPercent = Math.round((haven.currentOccupancy / haven.totalCapacity) * 100);

      // Proximity zone classification
      let proximityZone: ProximityMatch['proximityZone'] = 'regional_strategic';
      if (distanceKm <= 7.0) {
        proximityZone = 'immediate_walkable';
      } else if (distanceKm <= 20.0) {
        proximityZone = 'intermediate_tactical';
      }

      // Transit time estimates
      const walkingMinutes = Math.round((distanceKm / 4.0) * 60);
      const tractorMinutes = Math.round((distanceKm / 20.0) * 60);
      const convoyMinutes = Math.round((distanceKm / 45.0) * 60);

      // Composite Suitability Score:
      // Balances baseline site score (70%) with proximity factor (30%)
      const distanceDecay = Math.max(0, 1 - distanceKm / (maxRadiusKm * 1.5));
      const compositeScore = Math.round(haven.suitabilityScore * 0.75 + distanceDecay * 25);

      matches.push({
        haven,
        distanceKm,
        bearingDegrees: bearing.degrees,
        compassDirection: bearing.cardinal,
        elevationGainMeters,
        remainingCapacity,
        occupancyPercent,
        proximityZone,
        estimatedTransitTimeMinutes: {
          walking: walkingMinutes,
          tractor: tractorMinutes,
          convoyTruck: convoyMinutes,
        },
        compositeScore,
      });
    }
  });

  // Sort by composite score (highest first), then by distance
  return matches.sort((a, b) => {
    if (b.compositeScore !== a.compositeScore) {
      return b.compositeScore - a.compositeScore;
    }
    return a.distanceKm - b.distanceKm;
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. SPHERE STANDARDS REFUGEE CAMP DEPLOYMENT CALCULATOR
// ─────────────────────────────────────────────────────────────────────────────
export const calculateSphereCampRequirements = (
  evacueeHeadcount: number
): RefugeeCampManifest => {
  const safeCount = Math.max(50, evacueeHeadcount);

  // Sphere Humanitarian Standards 2024 (Camp Management Guidelines):
  // 1. Total Settlement Area: 45 m² per person (including roads, clinics, buffer zones)
  const requiredLandAreaSqMeters = safeCount * 45;

  // 2. Covered Shelter Living Space: 3.5 m² per person
  const coveredLivingAreaSqMeters = Math.round(safeCount * 3.5);

  // 3. Family Tents: 1 tent (16 m²) per family of 5
  const familyTentsCount = Math.ceil(safeCount / 5);

  // 4. Emergency Sanitation: 1 latrine per 20 persons (separated for men and women)
  const latrinesRequired = Math.ceil(safeCount / 20);

  // 5. Emergency Potable Water: 15 Liters / person / day (3L drinking + 12L sanitation/cooking)
  const waterDailyLiters = safeCount * 15;

  // 6. Water Bladders: Standard OXFAM / UNICEF 11,000 Liter (T-11) flexible pillow tanks
  const waterBladdersT11Count = Math.max(1, Math.ceil(waterDailyLiters / 11000));

  // 7. Handwashing Taps: 1 tap per 100 persons
  const communalHandwashTaps = Math.max(2, Math.ceil(safeCount / 100));

  // 8. Medical Triage Tents: 1 mobile clinic tent per 1,500 evacuees
  const medicalTriageTents = Math.max(1, Math.ceil(safeCount / 1500));

  // 9. Emergency Power: 10 kVA generator per 500 people for water pumps and cold-chain storage
  const powerMicrogridsKva = Math.max(15, Math.ceil((safeCount / 500) * 10));

  // 10. Solid Waste Pits: 1 pit per 500 people
  const wasteDisposalPitsCount = Math.max(1, Math.ceil(safeCount / 500));

  return {
    evacueeHeadcount: safeCount,
    requiredLandAreaSqMeters,
    coveredLivingAreaSqMeters,
    familyTentsCount,
    latrinesRequired,
    waterDailyLiters,
    waterBladdersT11Count,
    communalHandwashTaps,
    medicalTriageTents,
    powerMicrogridsKva,
    wasteDisposalPitsCount,
  };
};
