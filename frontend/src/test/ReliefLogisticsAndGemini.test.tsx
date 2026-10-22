import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import {
  getReliefRoutesForSector,
  getAlternateRoutesForSector,
  getHelicopterSortiesForSector,
  getWeatherStatusLabel,
  getFlightStatusLabel,
} from '@/data/teraiReliefRoutes';
import { EmergencyLogisticsHub } from '@/components/logistics/EmergencyLogisticsHub';
import { GeminiFloodAssistant } from '@/components/intelligence/GeminiFloodAssistant';
import { TERAI_RIVER_SECTORS } from '@/data/opticalFloodData';
import { TERAI_BRIDGES } from '@/data/teraiRoadNetwork';

describe('Stage 5.1 & Multi-Modal Logistics Enhancement Suite', () => {
  const mockSector = TERAI_RIVER_SECTORS.koshi_sector;
  const mockRelief = getReliefRoutesForSector('koshi_sector');
  const mockAlternate = getAlternateRoutesForSector('koshi_sector');
  const mockHelicopters = getHelicopterSortiesForSector('koshi_sector');

  describe('1. teraiReliefRoutes Data Layer', () => {
    it('retrieves ground relief convoy routes for Koshi sector', () => {
      expect(mockRelief.length).toBeGreaterThan(0);
      const first = mockRelief[0];
      expect(first).toHaveProperty('origin');
      expect(first).toHaveProperty('destination');
      expect(first).toHaveProperty('totalDistanceKm');
      expect(first.waypoints.length).toBeGreaterThan(1);
    });

    it('retrieves civilian alternate bypass detours with flood-free assurances', () => {
      expect(mockAlternate.length).toBeGreaterThan(0);
      const first = mockAlternate[0];
      expect(first).toHaveProperty('blockedRoad');
      expect(first).toHaveProperty('bypassName');
      expect(first).toHaveProperty('extraTimeMins');
      expect(first.safetyRating).toBe('safe');
    });

    it('retrieves helicopter air support sorties with aviation weather telemetry', () => {
      expect(mockHelicopters.length).toBeGreaterThan(0);
      const first = mockHelicopters[0];
      expect(first).toHaveProperty('aircraftType');
      expect(first).toHaveProperty('weatherDetails');
      expect(first.weatherDetails.ceiling_ft).toBeGreaterThan(1000);
      expect(first.weatherDetails.visibility_km).toBeGreaterThan(3);
    });

    it('computes weather and flight status labels accurately', () => {
      const vfr = getWeatherStatusLabel('VFR_clear');
      expect(vfr.label).toBe('VFR CLEAR');

      const marginal = getWeatherStatusLabel('MVFR_marginal');
      expect(marginal.label).toBe('MVFR MARGINAL');

      const flightCleared = getFlightStatusLabel('cleared_for_ops');
      expect(flightCleared.label).toBe('CLEARED FOR OPS');
    });
  });

  describe('2. EmergencyLogisticsHub Component', () => {
    it('renders the hub header and default relief convoys tab', () => {
      render(
        <EmergencyLogisticsHub
          reliefRoutes={mockRelief}
          alternateRoutes={mockAlternate}
          helicopterSorties={mockHelicopters}
          bridges={TERAI_BRIDGES}
        />
      );

      expect(screen.getByText(/Multi-Modal Emergency Logistics & Air Sortie Operations Hub/i)).toBeInTheDocument();
      expect(screen.getByText(/Active Ground Supply Lines to Flooded Settlements/i)).toBeInTheDocument();
    });

    it('switches between Relief Convoys, Civilian Bypasses, Air Support, and Bridges tabs', () => {
      render(
        <EmergencyLogisticsHub
          reliefRoutes={mockRelief}
          alternateRoutes={mockAlternate}
          helicopterSorties={mockHelicopters}
          bridges={TERAI_BRIDGES}
        />
      );

      // Switch to Civilian Bypasses
      const bypassTabBtn = screen.getByRole('button', { name: /Civilian Bypasses/i });
      fireEvent.click(bypassTabBtn);
      expect(screen.getByText(/Safe Detours for Travelers & Commercial Traffic/i)).toBeInTheDocument();

      // Switch to Air Support
      const airTabBtn = screen.getByRole('button', { name: /Air Support/i });
      fireEvent.click(airTabBtn);
      expect(screen.getByText(/Aviation Weather Feasibility & Nepal Army Helicopter Air-Evac Sorties/i)).toBeInTheDocument();

      // Switch to Bridges & Crossings
      const bridgesTabBtn = screen.getByRole('button', { name: /Bridges & Crossings/i });
      fireEvent.click(bridgesTabBtn);
      expect(screen.getByText(/Critical River Bridges & Barrages Vulnerability Telemetry/i)).toBeInTheDocument();
    });
  });

  describe('3. GeminiFloodAssistant Component', () => {
    it('renders the AI assistant panel and prompt chips', () => {
      render(
        <GeminiFloodAssistant
          sector={mockSector}
          adjustedFloodArea={342.5}
          selectedIndexName="MNDWI"
          hospitals={[]}
          bridges={TERAI_BRIDGES}
          safeHavens={[]}
          reliefRoutes={mockRelief}
          alternateRoutes={mockAlternate}
          helicopterSorties={mockHelicopters}
        />
      );

      expect(screen.getByText(/Gemini AI Flood Intelligence Assistant/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Ask Gemini: 'How much flood in current condition\?'/i)).toBeInTheDocument();
    });

    it('allows entering questions and clicking quick prompt suggestions', () => {
      render(
        <GeminiFloodAssistant
          sector={mockSector}
          adjustedFloodArea={342.5}
          selectedIndexName="MNDWI"
          hospitals={[]}
          bridges={TERAI_BRIDGES}
          safeHavens={[]}
          reliefRoutes={mockRelief}
          alternateRoutes={mockAlternate}
          helicopterSorties={mockHelicopters}
        />
      );

      // Direct text typing
      const input = screen.getByPlaceholderText(/Ask Gemini: 'How much flood in current condition\?'/i) as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'Are bridges safe to cross?' } });
      expect(input.value).toBe('Are bridges safe to cross?');

      // 1-Click quick preset prompt
      const promptChip = screen.getByText(/Flooded vs Dry Land Ratio/i);
      fireEvent.click(promptChip);

      expect(screen.getByText(/how much is flooded and how much is non-flooded land/i)).toBeInTheDocument();
    });
  });
});
