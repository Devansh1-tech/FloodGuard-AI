import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import L from 'leaflet';
import { ExecutiveDashboard } from '@/pages/dashboard/ExecutiveDashboard';
import { TERAI_CITIES_DATA } from '@/data/teraiCitiesData';

// Mock SVG Element for Leaflet headless rendering
// @ts-ignore
L.Browser.svg = true;
// @ts-ignore
if (typeof SVGElement !== 'undefined' && !SVGElement.prototype.createSVGRect) {
  // @ts-ignore
  SVGElement.prototype.createSVGRect = function () {
    return { x: 0, y: 0, width: 0, height: 0 };
  };
}

describe('Nepal Terai Disaster Command Console — Executive SITREP Dashboard Suite', () => {
  it('renders top executive action header with MoHA • NEOC • APF joint command and telemetry badge', () => {
    render(<ExecutiveDashboard onNavigateToTab={() => {}} />);

    expect(screen.getByText(/Nepal Terai Disaster Command Console/i)).toBeDefined();
    expect(screen.getByText(/MoHA • NEOC • APF Joint Operations Command/i)).toBeDefined();
    expect(screen.getByText(/LIVE TELEMETRY ONLINE/i)).toBeDefined();
  });

  it('renders top action group with focus map and one-click official SITREP PDF generator', () => {
    render(<ExecutiveDashboard onNavigateToTab={() => {}} />);

    expect(screen.getByText(/Focus Command Map/i)).toBeDefined();
    expect(screen.getByText(/Download Official SITREP \(PDF\)/i)).toBeDefined();
  });

  it('displays monospace KPI summary strip with all 4 high-density executive metrics', () => {
    render(<ExecutiveDashboard onNavigateToTab={() => {}} />);

    // Card 1
    expect(screen.getByText(/ACTIVE INUNDATION/i)).toBeDefined();
    expect(screen.getByText(/642.8 km²/i)).toBeDefined();
    expect(screen.getAllByText(/CRITICAL/i).length).toBeGreaterThan(0);

    // Card 2
    expect(screen.getByText(/HIGH-RISK ZONES/i)).toBeDefined();
    expect(screen.getByText(/12 Districts \/ 115 Wards/i)).toBeDefined();
    expect(screen.getByText(/\+2.4m Depth Peak/i)).toBeDefined();

    // Card 3
    expect(screen.getByText(/SEVERED CORRIDORS/i)).toBeDefined();
    expect(screen.getByText(/3 Key Highway Cuts/i)).toBeDefined();
    expect(screen.getByText(/DETOUR REQ/i)).toBeDefined();

    // Card 4
    expect(screen.getByText(/OPERATIONAL HAVENS/i)).toBeDefined();
    expect(screen.getByText(/8 Certified HLZ Bases/i)).toBeDefined();
    expect(screen.getByText(/4,200 CAP/i)).toBeDefined();
  });

  it('renders central map viewport container with exact DOM ID #map', () => {
    const { container } = render(<ExecutiveDashboard onNavigateToTab={() => {}} />);

    const mapElement = container.querySelector('#map');
    expect(mapElement).not.toBeNull();
    expect(mapElement?.id).toBe('map');
  });

  it('renders 21-District Severity Telemetry matrix with filter pills and inspect actions', () => {
    render(<ExecutiveDashboard onNavigateToTab={() => {}} />);

    expect(screen.getByText(/Nepal Terai 21 Districts Severity Telemetry/i)).toBeDefined();
    expect(screen.getByText(/21 Districts Tracked/i)).toBeDefined();
    expect(screen.getByRole('button', { name: 'ALL' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'CRITICAL' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'WARNING' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'SAFE' })).toBeDefined();

    const inspectButtons = screen.getAllByRole('button', { name: /Inspect/i });
    expect(inspectButtons.length).toBeGreaterThan(0);
  });

  it('opens Contextual Inspector Drawer upon clicking Inspect or Dossier badge', () => {
    render(<ExecutiveDashboard onNavigateToTab={() => {}} />);

    // Click on Dossier badge
    const dossierBadge = screen.getByText(/Rautahat Dossier/i);
    expect(dossierBadge).toBeDefined();
    fireEvent.click(dossierBadge);

    expect(screen.getByText(/Rautahat District Hub/i)).toBeDefined();
    expect(screen.getByText(/Demographic & Spatial Impact/i)).toBeDefined();
    expect(screen.getByText(/Gemini AI Tactical Directives/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Export District Brief/i })).toBeDefined();
  });

  it('contains comprehensive dataset for all 21 Terai district cities with color points', () => {
    expect(TERAI_CITIES_DATA.length).toBe(21);

    const biratnagar = TERAI_CITIES_DATA.find((c: any) => c.name.includes('Biratnagar'));
    expect(biratnagar).toBeDefined();
    expect(biratnagar!.color).toBe('#F97316');
    expect(biratnagar!.villagesAndTowns.length).toBeGreaterThan(3);

    const gaur = TERAI_CITIES_DATA.find((c: any) => c.name.includes('Gaur'));
    expect(gaur).toBeDefined();
    expect(gaur!.color).toBe('#EF4444');
    expect(
      gaur!.villagesAndTowns.some((v: any) => v.isFlooded && (v.floodDepthMeters || 0) > 2.0)
    ).toBe(true);

    const nepalgunj = TERAI_CITIES_DATA.find((c: any) => c.name.includes('Nepalgunj'));
    expect(nepalgunj).toBeDefined();
    expect(nepalgunj!.villagesAndTowns.length).toBeGreaterThan(3);
  });
});
