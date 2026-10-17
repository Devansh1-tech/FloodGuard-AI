import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/common/Badge';

describe('Badge Component', () => {
  it('renders badge content', () => {
    render(<Badge>HEALTHY</Badge>);
    expect(screen.getByText('HEALTHY')).toBeInTheDocument();
  });

  it('renders pulse dot when withPulse is true', () => {
    const { container } = render(<Badge withPulse variant="success">RUNNING</Badge>);
    expect(container.querySelector('.animate-ping')).toBeInTheDocument();
  });

  it('applies variant styling', () => {
    const { container } = render(<Badge variant="danger">FAILED</Badge>);
    expect(container.firstChild).toHaveClass('text-red-400');
  });
});
