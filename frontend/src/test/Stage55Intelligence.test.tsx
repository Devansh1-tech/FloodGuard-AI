/**
 * Stage55Intelligence.test.tsx — Unit & Integration Tests for Stage 5.5.
 *
 * Grounded in publicly available data:
 * - Nepal National Census 2021 (CBS / National Statistics Office)
 * - Ministry of Health and Population (MoHP) Health Facility Registry
 * - WHO Relief Logistics & EDCD Monsoon Disease Surveillance
 * - Google Gemini 1.5 Flash AI Demographic & Medical Dossier
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  TERAI_PUBLIC_SETTLEMENTS,
  getPublicSettlementDemographics,
} from '@/data/teraiPublicDemographics';
import {
  fetchSettlementDossier,
  getStoredGeminiApiKey,
  setStoredGeminiApiKey,
} from '@/services/geminiService';
import { SettlementDossierModal } from '@/components/intelligence/SettlementDossierModal';
import { DemographicsPage } from '@/pages/demographics/DemographicsPage';
import { HospitalDirectoryPage } from '@/pages/infrastructure/HospitalDirectoryPage';

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

describe('Stage 5.5: Public Demographic & Healthcare Intelligence Suite', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
    vi.restoreAllMocks();
  });

  describe('1. Terai Public Demographics & Hospital Catalog (Census 2021 + MoHP)', () => {
    it('contains verified settlement records across key Nepal Terai flood-risk hubs', () => {
      const keys = Object.keys(TERAI_PUBLIC_SETTLEMENTS);
      expect(keys.length).toBeGreaterThanOrEqual(5);

      // Verify Gaur, Rautahat record
      const gaur = TERAI_PUBLIC_SETTLEMENTS['gaur_rautahat'];
      expect(gaur).toBeDefined();
      expect(gaur.censusPopulation).toBe(39800);
      expect(gaur.infantsUnder5).toBeGreaterThan(0);
      expect(gaur.elderlyAbove60).toBeGreaterThan(0);
      expect(gaur.pregnantWomen).toBeGreaterThan(0);
      expect(gaur.publicHospitals.length).toBeGreaterThan(0);

      // Verify antivenom and hospital readiness in Gaur
      const gaurHospital = gaur.publicHospitals[0];
      expect(gaurHospital.totalBeds).toBeGreaterThan(0);
      expect(gaurHospital.antivenomStock).toContain('vials');
      expect(gaur.reliefRequirements.cleanWaterLitresPerDay).toBe(gaur.censusPopulation * 3);
    });

    it('retrieves public demographics via getPublicSettlementDemographics helper', () => {
      const gaurData = getPublicSettlementDemographics('Gaur', 'Rautahat');
      expect(gaurData.district).toBe('Rautahat');
      expect(gaurData.censusPopulation).toBe(39800);

      // Unknown settlement should return valid empirical model based on district
      const unknownSettlement = getPublicSettlementDemographics('CustomVillage', 'Rautahat');
      expect(unknownSettlement.name).toBe('CustomVillage');
      expect(unknownSettlement.censusPopulation).toBeGreaterThan(0);
      expect(unknownSettlement.publicHospitals.length).toBeGreaterThan(0);
    });
  });

  describe('2. Gemini Intelligence Client Service', () => {
    it('manages local storage for user Gemini API keys', () => {
      expect(getStoredGeminiApiKey()).toBeTruthy();
      setStoredGeminiApiKey('AIzaSyTestKey123456');
      expect(getStoredGeminiApiKey()).toBe('AIzaSyTestKey123456');
    });

    it('generates high-fidelity empirical fallback dossier when API is offline', async () => {
      // Mock fetch failure
      global.fetch = vi.fn().mockRejectedValue(new Error('Network offline'));

      const dossier = await fetchSettlementDossier({
        settlementName: 'Gaur',
        district: 'Rautahat',
        isFlooded: true,
        floodDepthMeters: 2.4,
      });

      expect(dossier).toBeDefined();
      expect(dossier.settlement_name).toBe('Gaur');
      expect(dossier.district).toBe('Rautahat');
      expect(dossier.is_flooded).toBe(true);
      expect(dossier.vulnerable_demographics.infants_under_5).toBeGreaterThan(0);
      expect(dossier.healthcare_facilities.length).toBeGreaterThan(0);
      expect(dossier.daily_relief_needs.potable_water_litres).toBeGreaterThan(0);
    });
  });

  describe('3. SettlementDossierModal Interactive Component', () => {
    it('renders modal with demographic breakdown and navigates tabs', async () => {
      render(
        <SettlementDossierModal
          isOpen={true}
          onClose={vi.fn()}
          settlementName="Gaur"
          district="Rautahat"
          isFlooded={true}
          floodDepthMeters={2.5}
        />
      );

      // Verify title, badge and district
      await waitFor(() => {
        expect(screen.getByText('Gaur')).toBeInTheDocument();
        expect(screen.getByText(/STAGE 5.5: GEMINI AI DEMOGRAPHIC & HEALTHCARE DOSSIER/i)).toBeInTheDocument();
      });

      // Verify Demographics tab content is visible
      expect(screen.getByText(/Total Population/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Infants/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Elderly/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Pregnant Mothers/i).length).toBeGreaterThan(0);

      // Switch to Healthcare & Hospitals tab
      const hospitalsTab = screen.getByRole('button', { name: /Hospitals & Antivenom/i });
      fireEvent.click(hospitalsTab);

      await waitFor(() => {
        expect(screen.getAllByText(/Snakebite Antivenom:/i).length).toBeGreaterThan(0);
      });

      // Switch to Disease & Relief tab
      const reliefTab = screen.getByRole('button', { name: /Disease Threats & Relief Needs/i });
      fireEvent.click(reliefTab);

      await waitFor(() => {
        expect(screen.getByText(/Calculated Daily Relief Supply Requirements/i)).toBeInTheDocument();
        expect(screen.getByText(/Potable Drinking Water/i)).toBeInTheDocument();
      });
    });

    it('triggers onClose when close button is clicked', async () => {
      const handleClose = vi.fn();
      render(
        <SettlementDossierModal
          isOpen={true}
          onClose={handleClose}
          settlementName="Birgunj"
          district="Parsa"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Birgunj')).toBeInTheDocument();
      });

      const closeButton = screen.getByRole('button', { name: /Close modal/i });
      fireEvent.click(closeButton);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('4. Demographics and Hospital Pages Stage 5.5 Integration', () => {
    it('renders DemographicsPage with Stage 5.5 public data grounding banner', () => {
      render(<DemographicsPage />);
      expect(screen.getByText(/STAGE 5.5: PUBLIC DEMOGRAPHIC & HEALTHCARE INTELLIGENCE/i)).toBeInTheDocument();
      expect(screen.getByText(/Nepal Census 2021 \(53.6% of national headcount\)/i)).toBeInTheDocument();
    });

    it('renders HospitalDirectoryPage with Stage 5.5 verified hospital registry', () => {
      render(<HospitalDirectoryPage />);
      expect(screen.getByText(/STAGE 5.5: PUBLIC HEALTHCARE REGISTRY & GEMINI INTEL/i)).toBeInTheDocument();
      expect(screen.getByText(/Hospital & Medical Infrastructure Directory/i)).toBeInTheDocument();
    });
  });
});
