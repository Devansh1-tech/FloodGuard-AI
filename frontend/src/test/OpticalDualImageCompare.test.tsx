import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { OpticalDualImageCompare, resolveSatelliteImage } from '../components/comparison/OpticalDualImageCompare';

describe('OpticalDualImageCompare Component', () => {
  it('renders without crashing and displays compact date controls', () => {
    render(<OpticalDualImageCompare />);
    
    // Check main title
    expect(screen.getByText(/Optical Satellite Dual-Image Comparison/i)).toBeInTheDocument();
    
    // Check Left and Right date controls
    expect(screen.getAllByText(/Left:/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Right:/i).length).toBeGreaterThan(0);
  });

  it('dynamically resolves different satellite images and statuses when dates change', () => {
    // 1. Dry pre-monsoon date
    const dryResult = resolveSatelliteImage('koshi_sector', '2024-06-15');
    expect(dryResult.floodStatus).toBe('DRY_BASELINE');
    expect(dryResult.src).toContain('koshi_pre_flood');

    // 2. Catastrophic flood deluge date
    const floodResult = resolveSatelliteImage('koshi_sector', '2024-10-01');
    expect(floodResult.floodStatus).toBe('PEAK_DELUGE');
    expect(floodResult.src).toContain('koshi_post_flood');

    // 3. Receding silt drainage date
    const recedingResult = resolveSatelliteImage('koshi_sector', '2024-10-18');
    expect(recedingResult.floodStatus).toBe('RECEDING_DRAINAGE');
    expect(recedingResult.src).toContain('koshi_receding_flood');

    // 4. Sector switching: Narayani Sector
    const narayaniDry = resolveSatelliteImage('narayani_sector', '2024-06-15');
    expect(narayaniDry.src).toContain('narayani_pre_flood');
    const narayaniFlood = resolveSatelliteImage('narayani_sector', '2024-10-01');
    expect(narayaniFlood.src).toContain('narayani_post_flood');

    // 5. Sector switching: Karnali Sector
    const karnaliDry = resolveSatelliteImage('karnali_sector', '2024-06-15');
    expect(karnaliDry.src).toContain('karnali_pre_flood');
    const karnaliFlood = resolveSatelliteImage('karnali_sector', '2024-10-01');
    expect(karnaliFlood.src).toContain('karnali_post_flood');
  });

  it('toggles floating calendar popover when clicking date pills', () => {
    render(<OpticalDualImageCompare />);
    
    // Initially floating calendar should not be open
    expect(screen.queryByText(/Left Image Date/i)).not.toBeInTheDocument();
    
    // Click Left date button
    const leftDateBtn = screen.getByTitle(/Click to open calendar for Left image date/i);
    fireEvent.click(leftDateBtn);
    
    // Floating calendar popover is now open
    expect(screen.getByText(/Left Image Date/i)).toBeInTheDocument();
    
    // Click close on floating calendar
    const closeBtn = screen.getByTitle(/Close calendar/i);
    fireEvent.click(closeBtn);
    expect(screen.queryByText(/Left Image Date/i)).not.toBeInTheDocument();
  });

  it('toggles collapsible mini grid drawer', () => {
    render(<OpticalDualImageCompare />);
    
    const miniGridBtn = screen.getByTitle(/Toggle inline mini-calendar grid/i);
    expect(screen.queryByText(/Left Image Date Picker/i)).not.toBeInTheDocument();
    
    // Click to open
    fireEvent.click(miniGridBtn);
    expect(screen.getByText(/Left Image Date Picker/i)).toBeInTheDocument();
    expect(screen.getByText(/Right Image Date Picker/i)).toBeInTheDocument();
    
    // Click to close
    fireEvent.click(miniGridBtn);
    expect(screen.queryByText(/Left Image Date Picker/i)).not.toBeInTheDocument();
  });

  it('renders all 10 Terai sectors when onSectorChange is provided', () => {
    const handleSectorChange = () => {};
    render(<OpticalDualImageCompare sectorKey="koshi_sector" onSectorChange={handleSectorChange} />);
    
    const selector = screen.getByTitle(/Switch Terai River Sector/i);
    expect(selector).toBeInTheDocument();
    expect(selector.children.length).toBe(10);
  });

  it('renders Google Earth Engine live badge and dataset selector with all collections', () => {
    render(<OpticalDualImageCompare />);
    
    // Check GEE Project ID Badge
    expect(screen.getByText(/Live GEE: home-credit-505106/i)).toBeInTheDocument();

    // Check Satellite Dataset Selector
    const datasetSelect = screen.getByTitle(/Select Live Earth Engine Surface Reflectance Dataset/i);
    expect(datasetSelect).toBeInTheDocument();
    expect(datasetSelect.children.length).toBe(4); // Sentinel-2, Sentinel-1, Landsat-8, Landsat-9

    // Check Direct GEE Stream Toggle button
    const geeToggle = screen.getByTitle(/Toggle between direct Google Earth Engine API stream and cached assets/i);
    expect(geeToggle).toBeInTheDocument();
    expect(screen.getByText(/GEE Live: ON/i)).toBeInTheDocument();

    // Toggle OFF
    fireEvent.click(geeToggle);
    expect(screen.getByText(/GEE Live: OFF/i)).toBeInTheDocument();
  });

  it('supports interactive zoom in, zoom out, presets, and reset controls', () => {
    render(<OpticalDualImageCompare />);
    
    // Check initial zoom percentage: 100%
    expect(screen.getAllByText('100%').length).toBeGreaterThan(0);
    
    // Check Zoom In button exists
    const zoomInBtns = screen.getAllByTitle(/Zoom In/i);
    expect(zoomInBtns.length).toBeGreaterThan(0);
    
    // Click Zoom In
    fireEvent.click(zoomInBtns[0]);
    expect(screen.getAllByText('150%').length).toBeGreaterThan(0);
    
    // Reset button should now be visible
    const resetBtns = screen.getAllByTitle(/Reset Zoom/i);
    expect(resetBtns.length).toBeGreaterThan(0);
    
    // Click Reset
    fireEvent.click(resetBtns[0]);
    expect(screen.getAllByText('100%').length).toBeGreaterThan(0);
    
    // Click 2x preset
    const preset2x = screen.getByTitle(/Set zoom to 2x/i);
    fireEvent.click(preset2x);
    expect(screen.getAllByText('200%').length).toBeGreaterThan(0);
  });

  it('supports cloud removal toggle between REMOVED (SCL/QA60 clear sky) and RAW mode', () => {
    render(<OpticalDualImageCompare />);
    
    // Check initial state: Clouds: REMOVED is active by default
    expect(screen.getByText(/Clouds: REMOVED/i)).toBeInTheDocument();
    
    // Find the toolbar cloud removal button
    const cloudToolbarBtn = screen.getByTitle(/Cloud Filter Active: SCL & QA60 pixels masked out/i);
    expect(cloudToolbarBtn).toBeInTheDocument();
    
    // Also find floating canvas HUD button
    const cloudHudBtn = screen.getByLabelText(/Toggle Cloud Removal Filter/i);
    expect(cloudHudBtn).toBeInTheDocument();
    
    // Click toolbar toggle to switch to RAW mode
    fireEvent.click(cloudToolbarBtn);
    expect(screen.getByText(/Clouds: RAW/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Cloud Filter Inactive: Showing raw optical satellite scene/i)).toBeInTheDocument();
    
    // Click HUD toggle to switch back to REMOVED
    fireEvent.click(cloudHudBtn);
    expect(screen.getByText(/Clouds: REMOVED/i)).toBeInTheDocument();
  });

  it('supports independent cloud removal for non-flooded image specifically and renders side-by-side view', () => {
    render(<OpticalDualImageCompare />);
    
    // Check Side-by-Side Comparison indicator
    expect(screen.getByText(/Side-by-Side Comparison/i)).toBeInTheDocument();

    // Check independent non-flooded cloud removal toggle button
    const nonFloodedBtn = screen.getByLabelText(/Toggle Non-Flooded Cloud Removal/i);
    expect(nonFloodedBtn).toBeInTheDocument();
    expect(screen.getByText(/Non-Flooded: CLEAN/i)).toBeInTheDocument();

    // Click to toggle non-flooded cloud to RAW
    fireEvent.click(nonFloodedBtn);
    expect(screen.getByText(/Non-Flooded: RAW/i)).toBeInTheDocument();

    // Click again to re-enable cloud removal
    fireEvent.click(nonFloodedBtn);
    expect(screen.getByText(/Non-Flooded: CLEAN/i)).toBeInTheDocument();
  });
});


