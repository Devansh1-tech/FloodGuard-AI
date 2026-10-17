import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import L from 'leaflet';
import App from '@/App';
import { TERAI_REGIONS } from '@/data/teraiRegions';
import { nepalBoundaries } from '@/data/nepalBoundaries';

// @ts-ignore
L.Browser.svg = true;
// @ts-ignore
if (typeof SVGElement !== 'undefined' && !SVGElement.prototype.createSVGRect) {
  // @ts-ignore
  SVGElement.prototype.createSVGRect = function () {
    return { x: 0, y: 0, width: 0, height: 0 };
  };
}

describe('Stage 5.1: BeforeAfterSlider Component & Geographic Data Suite', () => {
  it('contains Full Nepal Terai preset data with accurate geographical coordinates', () => {
    const fullTerai = TERAI_REGIONS.full_terai;
    expect(fullTerai.name).toContain('Full Nepal Terai Plains');
    expect(fullTerai.center).toEqual([27.35, 84.15]);
    expect(fullTerai.floodAreaKm2).toBe(642.8);
    expect(fullTerai.districts.length).toBe(21);
    expect(fullTerai.settlements.length).toBeGreaterThan(5);
    expect(fullTerai.safeZones.length).toBeGreaterThan(2);
  });

  it('contains regional presets for Koshi, Bagmati/Narayani, West Rapti, and Far-West Mahakali', () => {
    expect(TERAI_REGIONS.eastern_terai).toBeDefined();
    expect(TERAI_REGIONS.central_terai).toBeDefined();
    expect(TERAI_REGIONS.western_terai).toBeDefined();
    expect(TERAI_REGIONS.far_western_terai).toBeDefined();
  });

  it('contains valid official Nepal sovereign boundary and Terai plain boundary coordinates', () => {
    expect(nepalBoundaries.nepal_border.length).toBeGreaterThan(100);
    expect(nepalBoundaries.terai_full.length).toBeGreaterThan(100);
  });

  it('renders App component without throwing runtime exception', () => {
    const { container } = render(React.createElement(App));
    expect(container).toBeDefined();
  });
});
