import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import WarningsPage from './page';

vi.mock('next/font/google', () => ({
  Noto_Sans: () => ({ className: 'noto-sans' }),
}));

vi.mock('@/features/warnings', () => ({
  WarningWorkflow: () => <h1>Hazard monitoring</h1>,
}));

describe('WarningsPage', () => {
  it('renders the UC1 workflow in the design font', () => {
    const { container } = render(<WarningsPage />);

    expect(
      screen.getByRole('heading', { name: /hazard monitoring/i }),
    ).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('noto-sans');
    // uc1-screen.css widens the page and keeps it light only when this is present.
    expect(container.firstChild).toHaveAttribute('data-uc1-screen');
  });
});
