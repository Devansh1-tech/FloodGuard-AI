/**
 * Stage54Roads.test.tsx — Comprehensive Unit & Integration Tests for Stage 5.4.
 *
 * Verifies:
 * 1. Road Network Data Integrity (H01, H12, Feeders, submerged lengths, water depths).
 * 2. Bridge & Barrage Vulnerability Monitoring (Koshi, Bagmati, Narayani, Karnali, Lalbakeya).
 * 3. Isolated Communities & Cut-Off Populations (55,000 citizens across 4 clusters).
 * 4. Stage54RoadsPage Component rendering, tabs, and telemetry stats.
 */

import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  TERAI_ROAD_SEGMENTS,
  TERAI_BRIDGES,
  ISOLATED_COMMUNITIES,
  getRoadDisruptionStats,
} from '@/data/teraiRoadNetwork';
import { Stage54RoadsPage } from '@/pages/roads/Stage54RoadsPage';

// Mock Leaflet and Google Maps JS API for DOM testing environment
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="leaflet-map">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Polygon: ({ children }: { children?: React.ReactNode }) => <div data-testid="polygon">{children}</div>,
  Polyline: ({ children }: { children?: React.ReactNode }) => <div data-testid="polyline">{children}</div>,
  Marker: ({ children }: { children?: React.ReactNode }) => <div data-testid="marker">{children}</div>,
  Popup: ({ children }: { children?: React.ReactNode }) => <div data-testid="popup">{children}</div>,
  useMap: () => ({
    invalidateSize: vi.fn(),
    flyTo: vi.fn(),
  }),
}));

vi.mock('@googlemaps/js-api-loader', () => ({
  setOptions: vi.fn(),
  importLibrary: vi.fn().mockResolvedValue({
    Map: vi.fn().mockImplementation(() => ({
      panTo: vi.fn(),
      setZoom: vi.fn(),
      setMapTypeId: vi.fn(),
    })),
  }),
}));

describe('Stage 5.4: Road Network Inundation & Disruption Intelligence Data Suite', () => {
  it('validates primary Terai highway segments and statuses', () => {
    expect(TERAI_ROAD_SEGMENTS.length).toBeGreaterThanOrEqual(10);

    const submergedRoads = TERAI_ROAD_SEGMENTS.filter((r) => r.status === 'submerged');
    const restrictedRoads = TERAI_ROAD_SEGMENTS.filter((r) => r.status === 'restricted');
    const openRoads = TERAI_ROAD_SEGMENTS.filter((r) => r.status === 'open');

    expect(submergedRoads.length).toBeGreaterThan(0);
    expect(restrictedRoads.length).toBeGreaterThan(0);
    expect(openRoads.length).toBeGreaterThan(0);

    // Verify Gaur Postal Highway is marked submerged with depth > 2m
    const gaurPostal = TERAI_ROAD_SEGMENTS.find((r) => r.id === 'road_h12_gaur_kalaiya');
    expect(gaurPostal).toBeDefined();
    expect(gaurPostal?.status).toBe('submerged');
    expect(gaurPostal?.maxWaterDepthMeters).toBeGreaterThanOrEqual(2.0);
    expect(gaurPostal?.bypassRecommendation).toBeDefined();
  });

  it('validates critical Terai bridges and barrage telemetry', () => {
    expect(TERAI_BRIDGES.length).toBeGreaterThanOrEqual(7);

    // Verify Saptakoshi Barrage
    const koshi = TERAI_BRIDGES.find((b) => b.id === 'bridge_koshi_barrage');
    expect(koshi).toBeDefined();
    expect(koshi?.status).toBe('critical_danger');
    expect(koshi?.dischargeCusecs).toBeGreaterThanOrEqual(350000);

    // Verify Lalbakeya Tikulia Causeway collapse
    const tikulia = TERAI_BRIDGES.find((b) => b.id === 'bridge_lalbakeya_tikulia');
    expect(tikulia).toBeDefined();
    expect(tikulia?.trafficStatus).toBe('closed');
  });

  it('verifies cut-off communities and isolation telemetry', () => {
    expect(ISOLATED_COMMUNITIES.length).toBe(4);

    const stats = getRoadDisruptionStats();
    expect(stats.totalIsolatedPopulation).toBe(55000);
    expect(stats.totalSubmergedKm).toBeGreaterThan(0);
    expect(stats.totalRestrictedKm).toBeGreaterThan(0);
    expect(stats.criticalBridgesCount).toBeGreaterThanOrEqual(2);
  });
});

describe('Stage 5.4: Stage54RoadsPage Component & User Interface Suite', () => {
  it('renders page header and Stage 5.4 badge correctly', () => {
    render(<Stage54RoadsPage />);

    expect(
      screen.getByText(/STAGE 5.4: ROAD NETWORK INUNDATION & DISRUPTION ANALYSIS/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Terai Highway & Bridge Vulnerability Command/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/NEOC 1155 ROAD DISPATCH/i)).toBeInTheDocument();
  });

  it('renders all 5 telemetry cards accurately', () => {
    render(<Stage54RoadsPage />);

    expect(screen.getAllByText(/Submerged Roads/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Restricted \(4x4\)/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Open Passable/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Isolated Citizens/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Bridge Watch/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/55,000/i)[0]).toBeInTheDocument();
  });

  it('allows switching between Highway Network, Bridges, and Isolated Communities tabs', () => {
    render(<Stage54RoadsPage />);

    // Click Bridges tab
    const bridgesTab = screen.getByRole('button', { name: /Bridges & Barrages/i });
    fireEvent.click(bridgesTab);
    expect(screen.getAllByText(/Saptakoshi Barrage/i)[0]).toBeInTheDocument();

    // Click Isolated Communities tab
    const isolatedTab = screen.getByRole('button', { name: /Cut-Off Communities/i });
    fireEvent.click(isolatedTab);
    expect(screen.getAllByText(/Gaur Customs & Border Wards 2, 3, 4/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Bhajani Municipality & Lalbojhi Wards 3 & 7/i)[0]).toBeInTheDocument();
  });
});
