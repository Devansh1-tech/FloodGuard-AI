/**
 * Stage56Routing.test.tsx — Unit & Integration Test Suite for Stage 5.6 Emergency Routing.
 *
 * Covers:
 * 1. Graph model traversal and Dijkstra solver with dynamic flood penalties.
 * 2. Point 7: Relief & Medical Supply Convoy Router (Bharatpur → Gaur, Duhabi → Koshi).
 * 3. Point 9: Civilian Evacuation Alternate Route Navigator (Gaur → Chandranigahapur, Prakashpur → Barahachhetra).
 * 4. WHO emergency medical and food quota mathematical accuracy.
 * 5. Stage56RoutingPage UI rendering, tab navigation, waypoint guidance, and dispatch modal.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import {
  computeTeraiRoute,
  calculateWHOQuota,
  ROUTE_NODES,
  ROUTE_EDGES,
  EMERGENCY_MISSION_PRESETS,
} from '@/data/teraiRoutingNetwork';
import { Stage56RoutingPage } from '@/pages/routing/Stage56RoutingPage';

// Mock Leaflet for jsdom environment
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-map-container">{children}</div>
  ),
  TileLayer: () => <div data-testid="mock-tile-layer" />,
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
  }),
}));

describe('Stage 5.6: Emergency Routing & Evacuation Navigator Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1. DIJKSTRA PATHFINDER & FLOOD AVOIDANCE ENGINE TESTS
  // ───────────────────────────────────────────────────────────────────────────
  describe('1. Dijkstra Routing & Flood Avoidance Engine', () => {
    it('successfully calculates a safe convoy route from Bharatpur Depot to Gaur Deluge Zone', () => {
      const result = computeTeraiRoute('depot_bharatpur', 'target_gaur', 'army_6x6', true);

      expect(result).toBeDefined();
      expect(result.status).toBe('active_safe');
      expect(result.distanceKm).toBeGreaterThan(100);
      expect(result.estimatedMinutes).toBeGreaterThan(60);
      expect(result.path.length).toBeGreaterThan(5);

      // Verify strict flood avoidance
      expect(result.submergedKmBypassed).toBeGreaterThan(0);
      expect(result.avoidanceAlert).toContain('SUCCESSFUL DETOUR');
      expect(result.blockedDirectPath).toBeDefined();
    });

    it('successfully computes a civilian evacuation route to Barahachhetra High Ridge (Point 9)', () => {
      const result = computeTeraiRoute(
        'target_prakashpur',
        'haven_barahachhetra',
        'pedestrian_escort',
        true
      );

      expect(result.mode).toBe('civilian_alternate');
      expect(result.status).toBe('active_safe');
      expect(result.origin.elevationMeters).toBe(68);
      expect(result.destination.elevationMeters).toBe(185); // High ground ascent
      expect(result.destination.type).toBe('safe_haven');
      expect(result.safeHavenCapacity).toBe(8500);
      expect(result.steps.length).toBeGreaterThan(2);
    });

    it('generates sequential turn-by-turn waypoint steps with cumulative distances and elevations', () => {
      const result = computeTeraiRoute('depot_duhabi', 'target_hanumannagar', 'army_6x6', true);

      expect(result.steps.length).toBeGreaterThan(1);
      expect(result.steps[0].action).toBe('depart');
      expect(result.steps[result.steps.length - 1].action).toBe('arrive');

      // Cumulative kilometers should be strictly non-decreasing
      for (let i = 1; i < result.steps.length; i++) {
        expect(result.steps[i].cumulativeKm).toBeGreaterThanOrEqual(result.steps[i - 1].cumulativeKm);
      }
    });

    it('identifies critical bridges encountered along the route', () => {
      const result = computeTeraiRoute('depot_bharatpur', 'target_gaur', 'army_6x6', true);

      expect(result.bridgesEncountered.length).toBeGreaterThan(0);
      const bridgeNames = result.bridgesEncountered.map((b) => b.name);
      expect(bridgeNames.some((name) => name.includes('Bagmati'))).toBe(true);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. WHO EMERGENCY MEDICAL & RELIEF QUOTAS MATHEMATICAL ACCURACY
  // ───────────────────────────────────────────────────────────────────────────
  describe('2. WHO Emergency Medical & Cargo Quota Mathematical Validation', () => {
    it('accurately computes WHO standard rations for 10,000 cut-off persons', () => {
      const quota = calculateWHOQuota(10000);

      // 3.0 Liters water per person per day
      expect(quota.potableWaterLiters).toBe(30000);

      // 0.5 kg emergency food per person per day
      expect(quota.foodRationsKg).toBe(5000);

      // 2 chlorine Aquatabs per person per day
      expect(quota.aquatabsCount).toBe(20000);

      // 1 packet ORS per 4 persons
      expect(quota.orsPackets).toBe(2500);

      // Snakebite antivenom: 1 vial per 150 persons
      expect(quota.antivenomVials).toBe(Math.ceil(10000 / 150));

      // IV Saline bags: 1 bag per 30 persons
      expect(quota.ivSalineBags).toBe(Math.ceil(10000 / 30));

      // Fleet requirement: at least 7 trucks and 7 boats for 10,000 people
      expect(quota.trucksRequired).toBeGreaterThanOrEqual(7);
      expect(quota.zodiacBoatsRequired).toBeGreaterThanOrEqual(7);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. EMERGENCY MISSION PRESETS DATA INTEGRITY
  // ───────────────────────────────────────────────────────────────────────────
  describe('3. Emergency Mission Presets Catalog', () => {
    it('contains valid pre-configured relief and evacuation scenarios', () => {
      expect(EMERGENCY_MISSION_PRESETS.length).toBe(8);

      const convoyPresets = EMERGENCY_MISSION_PRESETS.filter((p) => p.type === 'relief_convoy');
      const evacPresets = EMERGENCY_MISSION_PRESETS.filter((p) => p.type === 'civilian_alternate');

      expect(convoyPresets.length).toBe(4);
      expect(evacPresets.length).toBe(4);

      // Verify all preset node IDs exist in the graph catalog
      EMERGENCY_MISSION_PRESETS.forEach((preset) => {
        expect(ROUTE_NODES[preset.originId]).toBeDefined();
        expect(ROUTE_NODES[preset.destinationId]).toBeDefined();
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. STAGE 5.6 UI COMPONENT RENDERING & INTERACTIONS
  // ───────────────────────────────────────────────────────────────────────────
  describe('4. Stage56RoutingPage Component & Interaction Tests', () => {
    it('renders the Stage 5.6 header badge and main operations title', () => {
      render(<Stage56RoutingPage />);

      expect(
        screen.getByText(/STAGE 5.6: EMERGENCY ROUTING & EVACUATION NAVIGATOR/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/Terai Emergency Routing Operations/i)).toBeInTheDocument();
      expect(screen.getByText(/Point 7: Convoy Router/i)).toBeInTheDocument();
      expect(screen.getByText(/Point 9: Evacuation Detours/i)).toBeInTheDocument();
    });

    it('renders mode switcher tabs and toggles between Convoy and Evacuation modes', () => {
      render(<Stage56RoutingPage />);

      const evacTab = screen.getByRole('button', { name: /Point 9: Civilian Evacuation/i });
      expect(evacTab).toBeInTheDocument();

      fireEvent.click(evacTab);

      // After switching to civilian evacuation, verify shelter profile or evac presets appear
      expect(
        screen.getByText(/Gaur Basin → Chandranigahapur Safe Ridge \(Evacuation\)/i)
      ).toBeInTheDocument();
    });

    it('renders all 4 telemetry metric cards accurately', () => {
      render(<Stage56RoutingPage />);

      expect(screen.getByText(/Total Transit Distance/i)).toBeInTheDocument();
      expect(screen.getByText(/Estimated Transit Time/i)).toBeInTheDocument();
      expect(screen.getByText(/Flood Avoidance Saved/i)).toBeInTheDocument();
      expect(screen.getByText(/Safety Status/i)).toBeInTheDocument();
    });

    it('renders WHO relief quota metrics when in Convoy Router mode', () => {
      render(<Stage56RoutingPage />);

      expect(screen.getByText(/WHO Emergency Relief & Medical Quota/i)).toBeInTheDocument();
      expect(screen.getByText(/Potable Drinking Water/i)).toBeInTheDocument();
      expect(screen.getByText(/Emergency Food Rations/i)).toBeInTheDocument();
      expect(screen.getByText(/Snakebite Antivenom Vials/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Chlorine Aquatabs/i).length).toBeGreaterThan(0);
    });

    it('opens and closes the Tactical Mission Dispatch Sheet modal', () => {
      render(<Stage56RoutingPage />);

      const exportBtn = screen.getByRole('button', {
        name: /Export Tactical Dispatch Sheet/i,
      });
      fireEvent.click(exportBtn);

      expect(
        screen.getByText(/Government Tactical Mission Dispatch Sheet/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/Turn-by-Turn Waypoint Sequence/i)).toBeInTheDocument();

      // Close modal
      const closeBtn = screen.getByRole('button', { name: /^close$/i });
      fireEvent.click(closeBtn);

      expect(
        screen.queryByText(/Government Tactical Mission Dispatch Sheet/i)
      ).not.toBeInTheDocument();
    });
  });
});
