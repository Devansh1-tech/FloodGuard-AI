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
});
