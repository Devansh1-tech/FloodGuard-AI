import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GoogleMapsViewer } from '@/components/map/GoogleMapsViewer';
import { Stage52GoogleMapPage } from '@/pages/map/Stage52GoogleMapPage';
import { TERAI_REGIONS } from '@/data/teraiRegions';
import { TERAI_FLOOD_CORRIDORS } from '@/data/teraiFloodCorridors';
import { TERAI_CITIES_DATA } from '@/data/teraiCitiesData';

// Mock @googlemaps/js-api-loader for headless test execution
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

describe('Nepal Terai Google Maps Platform Suite — Stage 5.3', () => {
  it('initializes GoogleMapsViewer with user Google Maps API key and Stage 5.3 controls', () => {
    const { container } = render(
      <GoogleMapsViewer apiKey="AIzaSyCYKKkl1C613n508xjv25SNSDFKO9Og0rw" />
    );
    expect(container).toBeDefined();
    expect(screen.getByText(/STAGE 5.3: FLOOD EXTENT & SETTLEMENT OVERLAY/i)).toBeDefined();
    expect(screen.getByText(/11 RIVER CORRIDORS • 21 TERAI DISTRICTS/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/Find any Terai village/i)).toBeDefined();
  });

  it('renders Stage52GoogleMapPage and displays dual provider controls', () => {
    render(<Stage52GoogleMapPage />);
    expect(screen.getByText(/Terai Disaster Command Map/i)).toBeDefined();
    expect(screen.getAllByText(/STAGE 5.3: FLOOD EXTENT & SETTLEMENT OVERLAY/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Sentinel-1 SAR Vector Flood Polygons/i)).toBeDefined();
    expect(screen.getByText(/21 Terai Cities & Village Dossiers/i)).toBeDefined();
  });

  it('contains full 21 Terai districts across all 5 regional basins in dataset', () => {
    expect(TERAI_REGIONS.full_terai.districts.length).toBe(21);
    expect(TERAI_REGIONS.eastern_terai.districts).toContain('Sunsari');
    expect(TERAI_REGIONS.central_terai.districts).toContain('Chitawan');
    expect(TERAI_REGIONS.western_terai.districts).toContain('Banke');
    expect(TERAI_REGIONS.far_western_terai.districts).toContain('Kailali');
  });

  it('verifies all 11 Sentinel-1 SAR flood corridors with water depths and severity', () => {
    expect(TERAI_FLOOD_CORRIDORS.length).toBe(11);
    const koshi = TERAI_FLOOD_CORRIDORS.find((c) => c.id === 'corridor_koshi_saptakoshi');
    expect(koshi).toBeDefined();
    expect(koshi?.severity).toBe('critical');
    expect(koshi?.inundatedAreaKm2).toBe(142.4);

    const gaur = TERAI_FLOOD_CORRIDORS.find((c) => c.id === 'corridor_bagmati_lalbakeya');
    expect(gaur).toBeDefined();
    expect(gaur?.districts).toContain('Rautahat');
    expect(gaur?.waterDepthRange).toBe('1.8m – 3.2m');
  });

  it('verifies all 21 Terai cities have color points and constituent villages', () => {
    expect(TERAI_CITIES_DATA.length).toBe(21);
    const biratnagar = TERAI_CITIES_DATA.find((c) => c.id === 'city_morang_biratnagar');
    expect(biratnagar).toBeDefined();
    expect(biratnagar?.color).toBe('#F97316');
    expect(biratnagar?.villagesAndTowns.length).toBeGreaterThan(0);

    const gaur = TERAI_CITIES_DATA.find((c) => c.id === 'city_rautahat_gaur');
    expect(gaur).toBeDefined();
    expect(gaur?.color).toBe('#EF4444');
    expect(gaur?.status).toBe('critical');
  });

  it('filters settlements using the quick search input', () => {
    render(<GoogleMapsViewer />);
    const searchInput = screen.getByPlaceholderText(/Find any Terai village/i);
    fireEvent.change(searchInput, { target: { value: 'Gaur' } });
    expect(screen.getByText(/Gaur Customs & Border Ward 2/i)).toBeDefined();
  });
});
