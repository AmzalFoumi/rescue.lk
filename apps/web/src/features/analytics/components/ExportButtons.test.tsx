import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExportButtons } from './ExportButtons';

describe('ExportButtons', () => {
  it('renders Export CSV and Export PDF buttons', () => {
    render(
      <ExportButtons
        isDisabled={false}
        isExporting={false}
        onExport={() => {}}
      />,
    );
    expect(
      screen.getByRole('button', { name: /Export CSV/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Export PDF/i }),
    ).toBeInTheDocument();
  });

  it('disables buttons when isDisabled is true', () => {
    render(
      <ExportButtons
        isDisabled={true}
        isExporting={false}
        onExport={() => {}}
      />,
    );
    expect(screen.getByRole('button', { name: /Export CSV/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Export PDF/i })).toBeDisabled();
  });

  it('disables buttons when isExporting is true', () => {
    render(
      <ExportButtons
        isDisabled={false}
        isExporting={true}
        onExport={() => {}}
      />,
    );
    expect(screen.getByRole('button', { name: /Export CSV/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Export PDF/i })).toBeDisabled();
  });

  it('calls onExport with CSV when CSV button is clicked', async () => {
    const onExport = vi.fn();
    const user = userEvent.setup();
    render(
      <ExportButtons
        isDisabled={false}
        isExporting={false}
        onExport={onExport}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Export CSV/i }));
    expect(onExport).toHaveBeenCalledWith('CSV');
  });

  it('calls onExport with PDF when PDF button is clicked', async () => {
    const onExport = vi.fn();
    const user = userEvent.setup();
    render(
      <ExportButtons
        isDisabled={false}
        isExporting={false}
        onExport={onExport}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Export PDF/i }));
    expect(onExport).toHaveBeenCalledWith('PDF');
  });
});
