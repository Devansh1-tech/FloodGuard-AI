/**
 * Stage57SafeHavens.test.tsx — Unit & Integration Test Suite for Stage 5.7 Safe Havens.
 *
 * Covers:
 * 1. Haversine distance, compass bearing, and k-NN spatial proximity scanner.
 * 2. Multi-criteria site suitability ranking (Elevation, WASH, Concrete Structure, HLZ Helipads).
 * 3. Sphere Humanitarian Standards refugee camp resource calculations.
 * 4. Safe haven dataset integrity across 21 Terai districts.
 * 5. Stage57SafeHavensPage UI rendering, settlement picker, radius adjuster, and deployment modal.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import {
  calculateHaversineDistanceKm,
  calculateCompassBearing,
  findNearbySafeHavens,
  calculateSphereCampRequirements,
} from '@/services/teraiProximityEngine';
import { TERAI_SAFE_HAVENS } from '@/data/teraiSafeHavens';
import { Stage57SafeHavensPage } from '@/pages/havens/Stage57SafeHavensPage';

// Mock Leaflet for jsdom environment
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-map-container">{children}</div>
  ),
  TileLayer: () => <div data-testid="mock-tile-layer" />,
  Circle: ({ center, radius, pathOptions }: any) => (
    <div
      data-testid="mock-circle"
      data-center={center?.join(',')}
      data-radius={radius}
      data-color={pathOptions?.color}
    />
  ),
  Polyline: ({ positions, pathOptions }: any) => (
    <div
      data-testid="mock-polyline"
      data-color={pathOptions?.color}
      data-points={positions?.length}
    />
  ),
  Marker: ({ children, position }: any) => (
    <div data-testid="mock-marker" data-lat={position[0]} data-lng={position[1]}>
      {children}
    </div>
  ),
  Popup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-popup">{children}</div>
  ),
  useMap: () => ({
    fitBounds: vi.fn(),
    setView: vi.fn(),
  }),
}));

describe('Stage 5.7: Safe Haven & Refugee Camp Proximity Detector Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1. GEOSPATIAL HAVERSINE & k-NN PROXIMITY ENGINE TESTS
  // ───────────────────────────────────────────────────────────────────────────
  describe('1. Geospatial Haversine & k-NN Proximity Engine', () => {
    it('accurately computes Haversine distance between Gaur and Chandranigahapur', () => {
      // Gaur: 26.7624, 85.2789; Chandranigahapur: 27.1321, 85.3385
      const distance = calculateHaversineDistanceKm(
        [26.7624, 85.2789],
        [27.1321, 85.3385]
      );

      // Distance should be ~41.5 km
      expect(distance).toBeGreaterThan(38);
      expect(distance).toBeLessThan(45);
    });

    it('calculates northward compass bearing from Gaur to Chandranigahapur', () => {
      const bearing = calculateCompassBearing(
        [26.7624, 85.2789],
        [27.1321, 85.3385]
      );

      expect(bearing.degrees).toBeGreaterThanOrEqual(0);
      expect(bearing.degrees).toBeLessThan(30);
      expect(bearing.cardinal).toBe('N');
    });

    it('scans and ranks nearby safe havens around flooded Gaur centroid', () => {
      const matches = findNearbySafeHavens(
        [26.7624, 85.2789],
        82, // Gaur elevation in meters
        45  // 45km scan radius
      );

      expect(matches.length).toBeGreaterThan(0);

      // Top matches should be in Rautahat or Sarlahi
      const topMatch = matches[0];
      expect(topMatch).toBeDefined();
      expect(['Rautahat', 'Sarlahi']).toContain(topMatch.haven.district);
      expect(topMatch.elevationGainMeters).toBeGreaterThan(0);
      expect(topMatch.compositeScore).toBeGreaterThanOrEqual(80);
    });

    it('filters safe havens by military helipad requirement', () => {
      const allMatches = findNearbySafeHavens([26.7624, 85.2789], 82, 50);
      const helipadMatches = findNearbySafeHavens([26.7624, 85.2789], 82, 50, {
        requiresHelipad: true,
      });

      expect(helipadMatches.length).toBeLessThanOrEqual(allMatches.length);
      helipadMatches.forEach((m) => {
        expect(m.haven.hasHelipad).toBe(true);
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. SPHERE STANDARDS REFUGEE CAMP DEPLOYMENT CALCULATIONS
  // ───────────────────────────────────────────────────────────────────────────
  describe('2. Sphere Humanitarian Standards Camp Deployment Formulas', () => {
    it('accurately computes resources for 5,000 displaced evacuees', () => {
      const manifest = calculateSphereCampRequirements(5000);

      // 1 family tent per 5 persons
      expect(manifest.familyTentsCount).toBe(1000);

      // 1 emergency latrine per 20 persons
      expect(manifest.latrinesRequired).toBe(250);

      // 15 Liters water / person / day
      expect(manifest.waterDailyLiters).toBe(75000);

      // 11,000L T-11 bladders: ceil(75,000 / 11,000) = 7 tanks
      expect(manifest.waterBladdersT11Count).toBe(7);

      // 1 tap per 100 persons
      expect(manifest.communalHandwashTaps).toBe(50);

      // Total camp area: 45 m² / person = 225,000 m²
      expect(manifest.requiredLandAreaSqMeters).toBe(225000);

      // Living space: 3.5 m² / person = 17,500 m²
      expect(manifest.coveredLivingAreaSqMeters).toBe(17500);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. SAFE HAVENS DATASET INTEGRITY
  // ───────────────────────────────────────────────────────────────────────────
  describe('3. Terai Safe Havens Catalog Integrity', () => {
    it('contains verified safe havens with coordinates within Terai boundaries', () => {
      expect(TERAI_SAFE_HAVENS.length).toBeGreaterThanOrEqual(14);

      TERAI_SAFE_HAVENS.forEach((haven) => {
        const [lat, lng] = haven.coords;
        // Nepal Terai bounds: Lat 26.20 - 28.99, Lng 79.95 - 88.25
        expect(lat).toBeGreaterThanOrEqual(26.20);
        expect(lat).toBeLessThanOrEqual(29.10);
        expect(lng).toBeGreaterThanOrEqual(79.95);
        expect(lng).toBeLessThanOrEqual(88.35);

        // Verification of essential fields
        expect(haven.elevationMeters).toBeGreaterThan(60);
        expect(haven.totalCapacity).toBeGreaterThanOrEqual(3000);
        expect(haven.wardenPhone).toBeTruthy();
        expect(haven.suitabilityScore).toBeGreaterThanOrEqual(80);
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. STAGE 5.7 UI COMPONENT RENDERING & INTERACTIONS
  // ───────────────────────────────────────────────────────────────────────────
  describe('4. Stage57SafeHavensPage Component & Interaction Tests', () => {
    it('renders the Stage 5.7 header badge and operations headline', () => {
      render(<Stage57SafeHavensPage />);

      expect(
        screen.getByText(/STAGE 5.7: SAFE HAVEN & REFUGEE CAMP PROXIMITY DETECTOR/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Terai Safe Haven & Refugee Shelter Engine/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Point 8: Nearby Safe Area Detector/i)
      ).toBeInTheDocument();
    });

    it('renders all 4 telemetry metric cards correctly', () => {
      render(<Stage57SafeHavensPage />);

      expect(screen.getByText(/Detected Safe Havens/i)).toBeInTheDocument();
      expect(screen.getByText(/Nearest High Ground/i)).toBeInTheDocument();
      expect(screen.getByText(/Remaining Capacity/i)).toBeInTheDocument();
      expect(screen.getByText(/Rotary Airdrop Pads/i)).toBeInTheDocument();
    });

    it('renders the Sphere refugee camp deployment planner with resource cards', () => {
      render(<Stage57SafeHavensPage />);

      expect(screen.getByText(/Sphere Refugee Camp Deployment Planner/i)).toBeInTheDocument();
      expect(screen.getByText(/Standard Family Tents/i)).toBeInTheDocument();
      expect(screen.getByText(/Emergency Latrines/i)).toBeInTheDocument();
      expect(screen.getByText(/Daily Water Volume/i)).toBeInTheDocument();
      expect(screen.getByText(/T-11 Water Bladders/i)).toBeInTheDocument();
      expect(screen.getByText(/Medical Triage Clinics/i)).toBeInTheDocument();
    });

    it('opens and closes the Emergency Refugee Camp Deployment Directive modal', () => {
      render(<Stage57SafeHavensPage />);

      const openModalBtn = screen.getByRole('button', {
        name: /Generate Sphere Camp Deployment Sheet/i,
      });
      fireEvent.click(openModalBtn);

      expect(
        screen.getByText(/Government Emergency Refugee Camp Deployment Directive/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Sphere Minimum Logistics Requisition Checklist/i)
      ).toBeInTheDocument();

      // Close modal
      const closeBtn = screen.getByRole('button', { name: /^close$/i });
      fireEvent.click(closeBtn);

      expect(
        screen.queryByText(/Government Emergency Refugee Camp Deployment Directive/i)
      ).not.toBeInTheDocument();
    });
  });
});
