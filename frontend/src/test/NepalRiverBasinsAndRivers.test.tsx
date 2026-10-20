/**
 * NepalRiverBasinsAndRivers.test.tsx — Unit Test Suite for Nepal River Basins,
 * Dotted River Trajectories, and Real-Time Live Telemetry Modal.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import {
  NEPAL_RIVER_BASINS,
  NEPAL_RIVERS,
  getRiverStatusColor,
} from '@/data/nepalRiverBasinsAndRivers';
import { LiveRiverTelemetryModal } from '@/components/gauges/LiveRiverTelemetryModal';

describe('Nepal River Basins & River Trajectories Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('1. Dataset Integrity & Geospatial Coordinates', () => {
    it('contains all 11 major river basins with dotted outline polygons', () => {
      expect(NEPAL_RIVER_BASINS.length).toBe(11);
      const basinIds = NEPAL_RIVER_BASINS.map((b) => b.id);
      expect(basinIds).toContain('basin_koshi');
      expect(basinIds).toContain('basin_gandaki');
      expect(basinIds).toContain('basin_karnali');
      expect(basinIds).toContain('basin_west_rapti');
      expect(basinIds).toContain('basin_bagmati');
      expect(basinIds).toContain('basin_babai');

      NEPAL_RIVER_BASINS.forEach((basin) => {
        expect(basin.boundaryPolygon.length).toBeGreaterThanOrEqual(4);
        expect(basin.catchmentAreaKm2).toBeGreaterThan(0);
        expect(basin.color).toBeDefined();
      });
    });

    it('contains all 12 primary rivers with high-resolution dotted polyline trajectories', () => {
      expect(NEPAL_RIVERS.length).toBe(12);
      const riverIds = NEPAL_RIVERS.map((r) => r.id);
      expect(riverIds).toContain('river_saptakoshi');
      expect(riverIds).toContain('river_narayani');
      expect(riverIds).toContain('river_karnali');
      expect(riverIds).toContain('river_bagmati');
      expect(riverIds).toContain('river_west_rapti');
      expect(riverIds).toContain('river_babai');

      NEPAL_RIVERS.forEach((river) => {
        expect(river.coordinates.length).toBeGreaterThanOrEqual(5);
        expect(river.currentLevelMeters).toBeGreaterThan(0);
        expect(river.dangerLevelMeters).toBeGreaterThan(0);
        expect(river.dischargeCusecs).toBeGreaterThan(0);
        expect(river.downstreamSettlements.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('returns appropriate status colors for river severity levels', () => {
      expect(getRiverStatusColor('extreme_flood')).toBe('#EF4444');
      expect(getRiverStatusColor('danger')).toBe('#F97316');
      expect(getRiverStatusColor('warning')).toBe('#F59E0B');
      expect(getRiverStatusColor('normal')).toBe('#00F2FE');
    });
  });

  describe('2. Live River Telemetry Modal Interactive Tests', () => {
    const saptakoshi = NEPAL_RIVERS.find((r) => r.id === 'river_saptakoshi')!;

    it('renders all river telemetry, thresholds, barrage status, and downstream risks', () => {
      render(
        <LiveRiverTelemetryModal
          river={saptakoshi}
          isOpen={true}
          onClose={vi.fn()}
          language="en"
        />
      );

      // Verify River Name and Basin
      expect(screen.getByText(/Saptakoshi River/i)).toBeDefined();
      expect(screen.getByText(/Koshi \(Saptakoshi\) River Basin/i)).toBeDefined();

      // Verify Hydrological Data
      expect(screen.getByText(/Live Water Level/i)).toBeDefined();
      expect(screen.getByText(/Live Discharge/i)).toBeDefined();
      expect(screen.getByText(/Danger \/ Warning Marks/i)).toBeDefined();
      expect(screen.getByText(/24h Catchment Rain/i)).toBeDefined();

      // Verify Barrage Info
      expect(screen.getByText(/Koshi Barrage/i)).toBeDefined();
      expect(screen.getByText(/56 \/ 56/i)).toBeDefined();

      // Verify Downstream Communities
      expect(screen.getByText(/Bhantabari Border Settlement/i)).toBeDefined();
      expect(screen.getByText(/Hanumannagar & Gobargadha Islands/i)).toBeDefined();
    });

    it('simulates live streaming updates over time', () => {
      render(
        <LiveRiverTelemetryModal
          river={saptakoshi}
          isOpen={true}
          onClose={vi.fn()}
          language="en"
        />
      );

      expect(screen.getByText(/Live DHM Stream/i)).toBeDefined();

      // Advance time by 3 seconds to trigger simulated WebSocket packet
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(screen.getByText(/Live DHM Stream/i)).toBeDefined();
    });

    it('supports bilingual rendering in Nepali vernacular', () => {
      render(
        <LiveRiverTelemetryModal
          river={saptakoshi}
          isOpen={true}
          onClose={vi.fn()}
          language="ne"
        />
      );

      expect(screen.getAllByText(/सप्तकोशी नदी/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/प्रत्यक्ष जलस्तर/i)).toBeDefined();
      expect(screen.getByText(/पानीको बहाव \(डिस्चार्ज\)/i)).toBeDefined();
      expect(screen.getByText(/खुला ढोकाहरू/i)).toBeDefined();
    });

    it('calls onClose when close button is clicked', () => {
      const handleClose = vi.fn();
      render(
        <LiveRiverTelemetryModal
          river={saptakoshi}
          isOpen={true}
          onClose={handleClose}
          language="en"
        />
      );

      const closeButtons = screen.getAllByRole('button', { name: /close/i });
      fireEvent.click(closeButtons[0]);
      expect(handleClose).toHaveBeenCalled();
    });
  });
});
