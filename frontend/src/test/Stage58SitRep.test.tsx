/**
 * Stage58SitRep.test.tsx — Unit & Integration Test Suite for Stage 5.8 SitRep PDF Export.
 *
 * Implements Point 10 of the Master Plan:
 * "in sabki report pdf form mai download ka option diya jayega so that its easy for government ki kaise kya karna hai"
 *
 * Covers:
 * 1. Live disaster data aggregator across Stages 5.1 - 5.7 (NDRRMA / UN-SPIDER 5-Section structure).
 * 2. WHO & Sphere humanitarian quota calculations (3L water/person/day, food rations, chlorine).
 * 3. jsPDF binary generation and download executor.
 * 4. SitRepDocument A4 official report layout component rendering.
 * 5. Stage58SitRepPage UI interaction (download trigger, window.print layout, telemetry refresh).
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import {
  generateLiveSitRepData,
  downloadSitRepPdf,
  SitRepData,
} from '@/services/sitrepGenerator';
import { SitRepDocument } from '@/components/sitrep/SitRepDocument';
import { Stage58SitRepPage } from '@/pages/sitrep/Stage58SitRepPage';

// Mock jsPDF
const mockSave = vi.fn();
const mockText = vi.fn();
const mockLine = vi.fn();
const mockRect = vi.fn();
const mockRoundedRect = vi.fn();
const mockSetFont = vi.fn();
const mockSetFontSize = vi.fn();
const mockSetTextColor = vi.fn();
const mockSetFillColor = vi.fn();
const mockSetDrawColor = vi.fn();
const mockSetLineWidth = vi.fn();
const mockAddPage = vi.fn();

vi.mock('jspdf', () => ({
  jsPDF: vi.fn().mockImplementation(() => ({
    save: mockSave,
    text: mockText,
    line: mockLine,
    rect: mockRect,
    roundedRect: mockRoundedRect,
    setFont: mockSetFont,
    setFontSize: mockSetFontSize,
    setTextColor: mockSetTextColor,
    setFillColor: mockSetFillColor,
    setDrawColor: mockSetDrawColor,
    setLineWidth: mockSetLineWidth,
    addPage: mockAddPage,
    internal: {
      pageSize: {
        getWidth: () => 210,
        getHeight: () => 297,
      },
    },
  })),
}));

describe('Stage 5.8: Official Government Situation Report (SitRep) Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.print = vi.fn();
  });

  describe('1. Live SitRep Data Aggregator (generateLiveSitRepData)', () => {
    it('aggregates live telemetry from Stages 5.1 to 5.7 into standard 5 sections', () => {
      const data = generateLiveSitRepData();

      expect(data.reportNumber).toMatch(/^NEOC\/SITREP\/TERAI-/);
      expect(data.alertLevel).toBe('RED_CRITICAL');
      expect(data.nationalLeadAgency).toContain('Ministry of Home Affairs');
      expect(data.scope).toContain('21 Districts');

      // Section 1: Executive Overview
      expect(data.executiveSummary.affectedDistrictsCount).toBe(21);
      expect(data.executiveSummary.totalFloodedAreaKm2).toBeGreaterThan(500);
      expect(data.executiveSummary.displacedEvacuees).toBeGreaterThan(50000);
      expect(data.executiveSummary.isolatedPopulation).toBeGreaterThan(0);
      expect(data.executiveSummary.activeRefugeeCamps).toBeGreaterThanOrEqual(16);

      // Section 2: Copernicus Sentinel-1 SAR
      expect(data.satelliteRadarData.sensor).toContain('Sentinel-1');
      expect(data.satelliteRadarData.otsuThresholdDb).toBe(-15.2);
      expect(data.satelliteRadarData.corridorsFloodedCount).toBe(11);
      expect(data.satelliteRadarData.severeBasins.length).toBeGreaterThanOrEqual(4);

      // Section 3: Transportation & Infrastructure Disruptions
      expect(data.infrastructureDisruptions.totalSubmergedHighwayKm).toBeGreaterThan(0);
      expect(data.infrastructureDisruptions.keyRoadBreaches.length).toBeGreaterThan(0);
      expect(data.infrastructureDisruptions.bridgeStatuses.length).toBeGreaterThan(0);

      // Section 4: Healthcare Readiness & WHO Relief Quotas
      expect(data.healthcareReadiness.totalHospitalsMonitored).toBeGreaterThan(0);
      expect(data.healthcareReadiness.antivenomVialsAvailable).toBeGreaterThan(50);
      expect(data.healthcareReadiness.dailyPotableWaterQuotalLiters).toBe(
        data.executiveSummary.displacedEvacuees * 3
      );
      expect(data.healthcareReadiness.dailyFoodRationsQuotaKg).toBe(
        Math.round(data.executiveSummary.displacedEvacuees * 0.5)
      );

      // Section 5: Action Directives & Safe Haven Allocations
      expect(data.actionDirectives.recommendedConvoys.length).toBeGreaterThan(0);
      expect(data.actionDirectives.primaryRefuges.length).toBeGreaterThanOrEqual(3);
      expect(data.actionDirectives.helicopterDropZones.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('2. jsPDF Binary Exporter (downloadSitRepPdf)', () => {
    it('initializes jsPDF and saves official SitRep document without errors', () => {
      const data = generateLiveSitRepData();
      downloadSitRepPdf(data);

      expect(mockSave).toHaveBeenCalledTimes(1);
      const savedFilename = mockSave.mock.calls[0][0];
      expect(savedFilename).toMatch(/^FloodGuard_AI_SitRep_Nepal_Terai_\d+\.pdf$/);

      // Verifies document construction elements
      expect(mockText).toHaveBeenCalled();
      expect(mockLine).toHaveBeenCalled();
      expect(mockRect).toHaveBeenCalled();
    });
  });

  describe('3. SitRepDocument Component Rendering', () => {
    it('renders the official Nepal Government header and seal badges', () => {
      const data = generateLiveSitRepData();
      render(<SitRepDocument sitrep={data} />);

      expect(screen.getByText(/National Emergency Operations Centre/i)).toBeDefined();
      expect(screen.getByText(/NATIONAL ALERT: RED_CRITICAL/i)).toBeDefined();
      expect(screen.getAllByText(/Ministry of Home Affairs/i).length).toBeGreaterThan(0);
    });

    it('renders Section 1: Executive Overview with human impact metrics', () => {
      const data = generateLiveSitRepData();
      render(<SitRepDocument sitrep={data} />);

      expect(screen.getByText(/Executive Disaster Summary & Human Toll/i)).toBeDefined();
      expect(screen.getAllByText(/642.8 km²/i).length).toBeGreaterThan(0);
    });

    it('renders Section 2: Satellite Deluge Quantification with Otsu threshold', () => {
      const data = generateLiveSitRepData();
      render(<SitRepDocument sitrep={data} />);

      expect(screen.getByText(/Copernicus Sentinel-1 SAR Microwave Radar Inundation Audit/i)).toBeDefined();
      expect(screen.getByText(/-15.2 dB/i)).toBeDefined();
      expect(screen.getByText(/Bagmati & Lalbakeya Delta/i)).toBeDefined();
      expect(screen.getByText(/Saptakoshi River Basin/i)).toBeDefined();
    });

    it('renders Section 3: Highway Network Inundations & Bridge Status', () => {
      const data = generateLiveSitRepData();
      render(<SitRepDocument sitrep={data} />);

      expect(screen.getByText(/Transportation Highway Network Cut-Offs & River Barrages/i)).toBeDefined();
      expect(screen.getByText(/Postal Highway \(Hulaki\): Gaur Customs/i)).toBeDefined();
      expect(screen.getByText(/Saptakoshi Barrage/i)).toBeDefined();
    });

    it('renders Section 4: Public Healthcare Assets & WHO Emergency Relief Quotas', () => {
      const data = generateLiveSitRepData();
      render(<SitRepDocument sitrep={data} />);

      expect(screen.getByText(/Healthcare Infrastructure Triage & WHO Relief Mandate/i)).toBeDefined();
      expect(screen.getByText(/3L \/ person \/ day/i)).toBeDefined();
      expect(screen.getByText(/Aquatabs Chlorine/i)).toBeDefined();
      expect(screen.getByText(/Antivenom Vials/i)).toBeDefined();
    });

    it('renders Section 5: Action Directives & Safe Haven Allocations', () => {
      const data = generateLiveSitRepData();
      render(<SitRepDocument sitrep={data} />);

      expect(screen.getByText(/Recommended Action Directives: Convoys, Shelters & HLZ/i)).toBeDefined();
      expect(screen.getByText(/Barahachhetra High Ridge Safe Haven/i)).toBeDefined();
      expect(screen.getByText(/Chatara Canal Foothill Terraces/i)).toBeDefined();
    });
  });

  describe('4. Stage58SitRepPage Command Page Interactions', () => {
    it('renders SitRep command page with telemetry HUD metrics', () => {
      render(<Stage58SitRepPage />);

      expect(screen.getByText(/STAGE 5.8: OFFICIAL GOVERNMENT SITUATION REPORT/i)).toBeDefined();
      expect(screen.getByText(/Executive Disaster Situation Report \(SitRep\)/i)).toBeDefined();
      expect(screen.getByRole('button', { name: /Download Official SitRep/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /Print Layout/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /Sync Live Data/i })).toBeDefined();
    });

    it('triggers PDF download when clicking Download Official SitRep button', async () => {
      render(<Stage58SitRepPage />);

      const downloadButton = screen.getByRole('button', { name: /Download Official SitRep/i });
      fireEvent.click(downloadButton);

      expect(mockSave).toHaveBeenCalledTimes(1);
    });

    it('triggers window.print when clicking Print Layout button', () => {
      render(<Stage58SitRepPage />);

      const printButton = screen.getByRole('button', { name: /Print Layout/i });
      fireEvent.click(printButton);

      expect(window.print).toHaveBeenCalledTimes(1);
    });

    it('refreshes telemetry timestamp when clicking Sync Live Data button', () => {
      render(<Stage58SitRepPage />);

      const refreshButton = screen.getByRole('button', { name: /Sync Live Data/i });
      fireEvent.click(refreshButton);

      // Verify page still renders report document intact
      expect(screen.getByText(/Executive Disaster Situation Report \(SitRep\)/i)).toBeDefined();
    });
  });
});
