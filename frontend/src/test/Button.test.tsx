import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/common/Button';

describe('Button Component', () => {
  it('renders button with children label', () => {
    render(<Button>Launch Analysis</Button>);
    expect(screen.getByRole('button', { name: /launch analysis/i })).toBeInTheDocument();
  });

  it('displays loading state and disables button', () => {
    render(<Button isLoading>Processing</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(btn).toHaveTextContent('Processing');
  });

  it('renders primary variant by default', () => {
    render(<Button>Primary Button</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-blue-600');
  });

  it('renders destructive variant', () => {
    render(<Button variant="destructive">Delete</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-red-600');
  });
});
