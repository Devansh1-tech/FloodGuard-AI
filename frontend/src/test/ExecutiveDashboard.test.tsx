import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import L from 'leaflet';
import { ExecutiveDashboard } from '@/pages/dashboard/ExecutiveDashboard';
import { EarthEngineScriptModal } from '@/components/gee/EarthEngineScriptModal';
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

describe('Government Officer Executive Dashboard & Earth Engine Suite', () => {
  it('renders official government command portal headline and active districts badge', () => {
    render(<ExecutiveDashboard onNavigateToTab={() => {}} />);

    expect(screen.getByText(/OFFICIAL GOVERNMENT COMMAND PORTAL/i)).toBeDefined();
    expect(screen.getByText(/Disaster Response & Flood Intelligence Console/i)).toBeDefined();
    expect(screen.getByText(/21 DISTRICTS ACTIVE/i)).toBeDefined();
  });

  it('renders rapid intelligence filter with date and layer display controls', () => {
    render(<ExecutiveDashboard onNavigateToTab={() => {}} />);

    expect(screen.getByText(/Officer Rapid Intelligence Filter/i)).toBeDefined();
    expect(screen.getByText(/Select Flood Event Observation Window/i)).toBeDefined();
    expect(screen.getByText(/What I Want to See on Map/i)).toBeDefined();
    expect(screen.getByText(/Show Both \(Flood vs Safe\)/i)).toBeDefined();
    expect(screen.getByText(/Flooded Area Only/i)).toBeDefined();
    expect(screen.getByText(/Non-Flooded \(Safe\) Only/i)).toBeDefined();
  });

  it('displays accurate quantitative telemetry for inundated km² and habitable land', () => {
    render(<ExecutiveDashboard onNavigateToTab={() => {}} />);

    expect(screen.getAllByText(/642.8 km²/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Inundated Flood Area/i)).toBeDefined();
    expect(screen.getByText(/Safe Non-Flooded Surface/i)).toBeDefined();
    expect(screen.getByText(/Exposed Citizens/i)).toBeDefined();
  });

  it('renders Google Earth Engine Sentinel-1 SAR script modal with JS and Python algorithms', () => {
    render(
      <EarthEngineScriptModal
        isOpen={true}
        onClose={() => {}}
        selectedRegionName="Eastern Terai (Koshi Basin)"
      />
    );

    expect(screen.getByText(/Google Earth Engine Sentinel-1 SAR Script/i)).toBeDefined();
    expect(screen.getAllByText(/COPERNICUS\/S1_GRD/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Open GEE Code Editor/i)).toBeDefined();
    expect(screen.getByText(/Copy Script/i)).toBeDefined();
  });

  it('contains comprehensive dataset for all 21 Terai district cities with color points', () => {
    expect(TERAI_CITIES_DATA.length).toBe(21);
    
    // Check key cities
    const biratnagar = TERAI_CITIES_DATA.find((c: any) => c.name.includes('Biratnagar'));
    expect(biratnagar).toBeDefined();
    expect(biratnagar!.color).toBe('#F97316');
    expect(biratnagar!.villagesAndTowns.length).toBeGreaterThan(3);

    const gaur = TERAI_CITIES_DATA.find((c: any) => c.name.includes('Gaur'));
    expect(gaur).toBeDefined();
    expect(gaur!.color).toBe('#EF4444');
    expect(gaur!.villagesAndTowns.some((v: any) => v.isFlooded && (v.floodDepthMeters || 0) > 2.0)).toBe(true);

    const nepalgunj = TERAI_CITIES_DATA.find((c: any) => c.name.includes('Nepalgunj'));
    expect(nepalgunj).toBeDefined();
    expect(nepalgunj!.villagesAndTowns.length).toBeGreaterThan(3);
  });
});
