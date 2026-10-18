import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GoogleMapsViewer } from '@/components/map/GoogleMapsViewer';
import { Stage52GoogleMapPage } from '@/pages/map/Stage52GoogleMapPage';
import { TERAI_REGIONS } from '@/data/teraiRegions';

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

describe('Nepal Terai Google Maps Platform Suite', () => {
  it('initializes GoogleMapsViewer with user Google Maps API key and Full Terai preset', () => {
    const { container } = render(
      <GoogleMapsViewer apiKey="AIzaSyCYKKkl1C613n508xjv25SNSDFKO9Og0rw" />
    );
    expect(container).toBeDefined();
    expect(screen.getByText(/GOOGLE MAPS FIELD COMMAND/i)).toBeDefined();
    expect(screen.getByText(/LOCKED TO NEPAL TERAI \(21 DISTRICTS\)/i)).toBeDefined();
  });

  it('renders Stage52GoogleMapPage and displays dual provider controls', () => {
    render(<Stage52GoogleMapPage />);
    expect(screen.getByText(/Terai Disaster Command Map/i)).toBeDefined();
    expect(screen.getByText(/GOOGLE MAPS PLATFORM/i)).toBeDefined();
    expect(screen.getByText(/Google Maps JavaScript API Engine/i)).toBeDefined();
    expect(screen.getByText(/Real-Time Highway Traffic Flow/i)).toBeDefined();
  });

  it('contains full 21 Terai districts across all 5 regional basins in dataset', () => {
    expect(TERAI_REGIONS.full_terai.districts.length).toBe(21);
    expect(TERAI_REGIONS.eastern_terai.districts).toContain('Sunsari');
    expect(TERAI_REGIONS.central_terai.districts).toContain('Chitawan');
    expect(TERAI_REGIONS.western_terai.districts).toContain('Banke');
    expect(TERAI_REGIONS.far_western_terai.districts).toContain('Kailali');
  });
});
