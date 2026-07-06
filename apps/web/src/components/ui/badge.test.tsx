import { render, screen } from '@testing-library/react';
import { Badge } from './badge';
import { describe, it, expect } from 'vitest';

describe('Badge', () => {
  it('renders correctly with default variant', () => {
    render(<Badge>Test Badge</Badge>);
    expect(screen.getByText('Test Badge')).toBeInTheDocument();
  });

  it('renders correctly with outline variant', () => {
    render(<Badge variant="outline">Outline Badge</Badge>);
    const badge = screen.getByText('Outline Badge');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('text-foreground');
  });
});
