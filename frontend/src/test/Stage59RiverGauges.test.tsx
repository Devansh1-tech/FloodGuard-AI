/**
 * Stage59RiverGauges.test.tsx — Unit & Integration Test Suite for Stage 5.9 River Gauges & SOS Alerts.
 *
 * Implements Point 11 of the Master Plan:
 * 1. Nepal DHM hydrological monitoring dataset integrity.
 * 2. Multi-channel Vernacular SOS alert generator (SMS, WhatsApp, Community Radio).
 * 3. WaterGaugeVisualizer animated liquid gauge and hydrograph component.
 * 4. VernacularSosModal channel switching, copy interactions, and character limits.
 * 5. Stage59RiverGaugesPage bilingual switching (नेपाली / English) and search filters.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import {
  TERAI_RIVER_GAUGES,
  RiverGaugeStation,
} from '@/data/teraiRiverGauges';
import {
  generateClientVernacularAlert,
  computeTelemetrySummary,
  fetchRiverGauges,
} from '@/services/riverGaugeService';
import { WaterGaugeVisualizer } from '@/components/gauges/WaterGaugeVisualizer';
import { VernacularSosModal } from '@/components/gauges/VernacularSosModal';
import { Stage59RiverGaugesPage } from '@/pages/gauges/Stage59RiverGaugesPage';

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
  Marker: ({ children, position }: any) => (
    <div data-testid="mock-marker" data-lat={position[0]} data-lng={position[1]}>
      {children}
    </div>
  ),
  Popup: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="mock-popup">{children}</div>
  ),
  Polygon: ({ children, positions, pathOptions }: any) => (
    <div data-testid="mock-polygon" data-dash={pathOptions?.dashArray}>{children}</div>
  ),
  Polyline: ({ children, positions, pathOptions, eventHandlers }: any) => (
    <div data-testid="mock-polyline" data-dash={pathOptions?.dashArray} onClick={eventHandlers?.click}>{children}</div>
  ),
  Tooltip: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="mock-tooltip">{children}</div>
  ),
  useMap: () => ({
    flyTo: vi.fn(),
    fitBounds: vi.fn(),
    setView: vi.fn(),
  }),
}));

describe('Stage 5.9: DHM River Gauge Telemetry & Vernacular SOS Alerts Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. DHM River Gauge Dataset Integrity', () => {
    it('covers key Terai flood corridors across Koshi, Bagmati, Narayani, Rapti, and Karnali', () => {
      expect(TERAI_RIVER_GAUGES.length).toBeGreaterThanOrEqual(7);

      const riverCorridors = TERAI_RIVER_GAUGES.map((g) => `${g.river} ${g.basin}`);
      expect(riverCorridors.some((b) => b.includes('Koshi'))).toBe(true);
      expect(riverCorridors.some((b) => b.includes('Bagmati'))).toBe(true);
      expect(riverCorridors.some((b) => b.includes('Narayani'))).toBe(true);
      expect(riverCorridors.some((b) => b.includes('Rapti'))).toBe(true);
      expect(riverCorridors.some((b) => b.includes('Karnali'))).toBe(true);
    });

    it('verifies all station coordinates lie within Nepal Terai boundaries', () => {
      TERAI_RIVER_GAUGES.forEach((station) => {
        const [lat, lng] = station.coords;
        expect(lat).toBeGreaterThanOrEqual(26.20);
        expect(lat).toBeLessThanOrEqual(28.80);
        expect(lng).toBeGreaterThanOrEqual(80.00);
        expect(lng).toBeLessThanOrEqual(88.20);
      });
    });

    it('verifies danger thresholds strictly exceed warning thresholds and history exists', () => {
      TERAI_RIVER_GAUGES.forEach((station) => {
        expect(station.dangerLevelMeters).toBeGreaterThan(station.warningLevelMeters);
        expect(station.hourlyHistory.length).toBeGreaterThanOrEqual(6);
        expect(station.downstreamSettlements.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('verifies Saptakoshi Chatara station telemetry metrics', () => {
      const chatara = TERAI_RIVER_GAUGES.find((g) => g.id === 'gauge_koshi_chatara');
      expect(chatara).toBeDefined();
      expect(chatara?.dischargeCusecs).toBe(462000);
      expect(chatara?.totalSluiceGates).toBe(56);
      expect(chatara?.sluiceGatesOpen).toBe(56);
      expect(chatara?.status).toBe('extreme_flood');
    });
  });

  describe('2. Vernacular SOS Alert Generator & Telemetry Engine', () => {
    it('generates multi-channel alerts (SMS, WhatsApp, Radio) in pure vernacular Nepali', () => {
      const narayani = TERAI_RIVER_GAUGES.find((g) => g.id === 'gauge_narayani_devghat')!;
      const alert = generateClientVernacularAlert(narayani);

      // 1. Compact Nepali SMS
      expect(alert.channels.smsNepaliCompact).toContain('🚨बाढी संकटकालीन चेतावनी');
      expect(alert.channels.smsNepaliCompact).toContain('नारायणी');
      expect(alert.channels.smsNepaliCompact).toContain('1155');
      expect(alert.channels.smsNepaliCompact.length).toBeLessThanOrEqual(160);

      // 2. Rich WhatsApp
      expect(alert.channels.whatsappNepaliRich).toContain('*🚨 बाढी संकटकालीन पूर्वसूचना');
      expect(alert.channels.whatsappNepaliRich).toContain('१११४');
      expect(alert.channels.shareableWhatsappUrl).toContain('https://wa.me/?text=');

      // 3. Community FM Radio broadcast script
      expect(alert.channels.communityRadioScriptNepali).toContain('नमस्कार, यो बाढी गार्ड एआई');
      expect(alert.channels.communityRadioScriptNepali).toContain('नारायणी');
      expect(alert.channels.communityRadioScriptEnglish).toContain('This is an urgent flood bulletin');
    });

    it('computes executive telemetry summary counters accurately', () => {
      const summary = computeTelemetrySummary(TERAI_RIVER_GAUGES);
      expect(summary.totalStationsMonitored).toBe(TERAI_RIVER_GAUGES.length);
      expect(summary.stationsInDangerOrExtreme).toBeGreaterThanOrEqual(3);
      expect(summary.maximumDischargeCusecs).toBeGreaterThanOrEqual(400000);
      expect(summary.totalDownstreamPopulationAtRisk).toBeGreaterThan(50000);
    });
  });

  describe('3. WaterGaugeVisualizer Component', () => {
    it('renders station name, river, current water level, and hydrograph', () => {
      const chatara = TERAI_RIVER_GAUGES.find((g) => g.id === 'gauge_koshi_chatara')!;
      const mockOpenModal = vi.fn();

      render(
        <WaterGaugeVisualizer
          gauge={chatara}
          language="en"
          onOpenSosModal={mockOpenModal}
        />
      );

      expect(screen.getByText(/Saptakoshi at Chatara/i)).toBeDefined();
      expect(screen.getByText(/Saptakoshi River/i)).toBeDefined();
      expect(screen.getByText(/D: 7.2m/i)).toBeDefined();
      expect(screen.getByText(/W: 6m/i)).toBeDefined();
      expect(screen.getByText(/12-Hour Hydrograph Trend/i)).toBeDefined();
      expect(screen.getByText(/River Barrage Sluice Operation/i)).toBeDefined();
    });

    it('renders Nepali vernacular labels when language is set to ne', () => {
      const narayani = TERAI_RIVER_GAUGES.find((g) => g.id === 'gauge_narayani_devghat')!;
      const mockOpenModal = vi.fn();

      render(
        <WaterGaugeVisualizer
          gauge={narayani}
          language="ne"
          onOpenSosModal={mockOpenModal}
        />
      );

      expect(screen.getByText(/नारायणी नदी - देवघाट संगम केन्द्र/i)).toBeDefined();
      expect(screen.getByText(/१२-घण्टे जलसतह प्रवृत्ति/i)).toBeDefined();
    });

    it('triggers SOS modal callback when clicking broadcast button', () => {
      const chatara = TERAI_RIVER_GAUGES.find((g) => g.id === 'gauge_koshi_chatara')!;
      const mockOpenModal = vi.fn();

      render(
        <WaterGaugeVisualizer
          gauge={chatara}
          language="en"
          onOpenSosModal={mockOpenModal}
        />
      );

      const broadcastBtn = screen.getByRole('button', { name: /Generate Vernacular SOS Broadcast/i });
      fireEvent.click(broadcastBtn);

      expect(mockOpenModal).toHaveBeenCalledWith(chatara);
    });
  });

  describe('4. VernacularSosModal Component', () => {
    it('renders multi-channel tabs, copy actions, and WhatsApp dispatch link', async () => {
      const chatara = TERAI_RIVER_GAUGES.find((g) => g.id === 'gauge_koshi_chatara')!;
      const mockClose = vi.fn();

      // Mock navigator.clipboard
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText,
        },
      });

      render(
        <VernacularSosModal
          gauge={chatara}
          isOpen={true}
          onClose={mockClose}
          language="ne"
        />
      );

      expect(screen.getByText(/सप्तकोशी नदी - संकटकालीन सूचना/i)).toBeDefined();
      expect(screen.getByText(/1. SMS Broadcast/i)).toBeDefined();
      expect(screen.getByText(/2. WhatsApp \/ Social Media/i)).toBeDefined();
      expect(screen.getByText(/3. Community Radio FM Script/i)).toBeDefined();

      // Test Copy SMS
      const copySmsBtn = screen.getByRole('button', { name: /Copy SMS/i });
      fireEvent.click(copySmsBtn);
      expect(mockWriteText).toHaveBeenCalled();

      // Switch to WhatsApp Tab
      const waTab = screen.getByRole('button', { name: /2. WhatsApp \/ Social Media/i });
      fireEvent.click(waTab);
      expect(screen.getByRole('link', { name: /Send via WhatsApp/i })).toBeDefined();

      // Switch to Radio Tab
      const radioTab = screen.getByRole('button', { name: /3. Community Radio FM Script/i });
      fireEvent.click(radioTab);
      expect(screen.getByText(/सामुदायिक रेडियो \(FM\) प्रत्यक्ष प्रसारण वाचन पाठ/i)).toBeDefined();
    });
  });

  describe('5. Stage59RiverGaugesPage Interactions & Bilingual Toggle', () => {
    it('renders Stage 5.9 header, HUD telemetry counters, and gauge cards', () => {
      render(<Stage59RiverGaugesPage />);

      expect(screen.getByText(/STAGE 5.9: DHM RIVER GAUGES & VERNACULAR SOS ALERTS/i)).toBeDefined();
      expect(screen.getByText(/Point 11: Real-Time Early Warning/i)).toBeDefined();
      expect(screen.getByText(/नेपाली \(Vernacular\)/i)).toBeDefined();
      expect(screen.getByText(/English/i)).toBeDefined();
      expect(screen.getByTestId('mock-map-container')).toBeDefined();
    });

    it('toggles bilingual language from Nepali to English smoothly', () => {
      render(<Stage59RiverGaugesPage />);

      const englishBtn = screen.getByRole('button', { name: /^English$/i });
      fireEvent.click(englishBtn);

      expect(screen.getByText(/Real-Time River Gauge Telemetry & Vernacular Alerts/i)).toBeDefined();
      expect(screen.getByText(/Monitored DHM Gauges/i)).toBeDefined();
      expect(screen.getAllByText(/Danger Level Breached/i).length).toBeGreaterThan(0);
    });

    it('filters gauge stations using the search input', () => {
      render(<Stage59RiverGaugesPage />);

      const searchInput = screen.getByPlaceholderText(/नदी वा केन्द्र खोज्नुहोस्/i);
      fireEvent.change(searchInput, { target: { value: 'Karmaiya' } });

      // Karmaiya / Bagmati should be displayed, Chatara should be filtered out
      expect(screen.getAllByText(/बागमती नदी - कर्मैया/i).length).toBeGreaterThan(0);
      expect(screen.queryByText(/सप्तकोशी - चतरा/i)).toBeNull();
    });

    it('matches gauge stations by DHM station number (e.g., 695) and clears with X button', () => {
      render(<Stage59RiverGaugesPage />);

      const searchInput = screen.getByPlaceholderText(/नदी वा केन्द्र खोज्नुहोस्/i);
      fireEvent.change(searchInput, { target: { value: '695' } });

      // DHM-695 (Saptakoshi Chatara) should match
      expect(screen.getAllByText(/सप्तकोशी - चतरा/i).length).toBeGreaterThan(0);
      expect(screen.queryByText(/बागमती नदी - कर्मैया/i)).toBeNull();

      // Click clear search button
      const clearBtn = screen.getByTitle(/Clear search query/i);
      fireEvent.click(clearBtn);

      expect(searchInput).toHaveValue('');
      expect(screen.getAllByText(/सप्तकोशी - चतरा/i).length).toBeGreaterThan(0);
    });

    it('updates telemetry and clears danger breaches when switching to Dry Season scenario', async () => {
      render(<Stage59RiverGaugesPage />);

      const scenarioSelect = screen.getByTitle(/Select Real Hydrological Date & Monsoon Flood Scenario/i);
      fireEvent.change(scenarioSelect, { target: { value: 'dry_baseline' } });

      // Wait for dry season baseline to compute and render
      await waitFor(() => {
        expect(screen.getAllByText(/कुनै खतरा छैन • सामान्य सुरक्षित बहाव/i).length).toBeGreaterThan(0);
      });
    });

    it('resets all filters back to default live deluge telemetry', async () => {
      render(<Stage59RiverGaugesPage />);

      // Apply non-default search and scenario
      const searchInput = screen.getByPlaceholderText(/नदी वा केन्द्र खोज्नुहोस्/i);
      fireEvent.change(searchInput, { target: { value: 'NonExistentPlace' } });

      expect(screen.getByText(/कुनै केन्द्र फेला परेन/i)).toBeDefined();

      // Click Reset All Filters
      const resetBtn = screen.getByRole('button', { name: /सबै रिसेट गर्नुहोस्/i });
      fireEvent.click(resetBtn);

      expect(searchInput).toHaveValue('');
      await waitFor(() => {
        expect(screen.getAllByText(/सप्तकोशी - चतरा/i).length).toBeGreaterThan(0);
      });
    });
  });
});
