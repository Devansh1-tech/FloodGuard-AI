import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatCard } from '@/components/common/StatCard';

describe('StatCard Component', () => {
  it('renders title and value properly', () => {
    render(
      <StatCard
        title="Flood Inundation"
        value="180.6 km²"
        subtitle="Sentinel-1 SAR"
      />
    );
    expect(screen.getByText('Flood Inundation')).toBeInTheDocument();
    expect(screen.getByText('180.6 km²')).toBeInTheDocument();
    expect(screen.getByText('Sentinel-1 SAR')).toBeInTheDocument();
  });

  it('renders loading skeleton when isLoading is true', () => {
    const { container } = render(
      <StatCard
        title="Displaced Population"
        value="11,961"
        isLoading={true}
      />
    );
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });
});
