import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import WarningsPage from './page';

vi.mock('next/font/google', () => ({
  Noto_Sans: () => ({ className: 'noto-sans' }),
}));

vi.mock('@/features/warnings', () => ({
  AppHeader: () => <header>rescue.lk</header>,
  WarningWorkflow: () => <h1>Hazard monitoring</h1>,
}));

describe('WarningsPage', () => {
  it('renders the design header above the UC1 workflow in the design font', () => {
    const { container } = render(<WarningsPage />);

    const header = screen.getByRole('banner');
    const heading = screen.getByRole('heading', { name: /hazard monitoring/i });
    expect(
      header.compareDocumentPosition(heading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(container.firstChild).toHaveClass('noto-sans');
    // uc1-screen.css widens the page, keeps it light and hides the scaffold header
    // only when this is present.
    expect(container.firstChild).toHaveAttribute('data-uc1-screen');
  });
});
