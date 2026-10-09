import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnalyticsFilterBar } from './AnalyticsFilterBar';

describe('AnalyticsFilterBar', () => {
  it('renders all filter fields with their current values', () => {
    const filters = {
      from: '2026-09-09',
      setFrom: vi.fn(),
      to: '2026-10-09',
      setTo: vi.fn(),
      district: 'Colombo',
      setDistrict: vi.fn(),
      hazardType: 'Flood',
      setHazardType: vi.fn(),
    };

    render(<AnalyticsFilterBar filters={filters} />);

    expect(screen.getByLabelText('From Date')).toHaveValue('2026-09-09');
    expect(screen.getByLabelText('To Date')).toHaveValue('2026-10-09');
    expect(screen.getByLabelText('District')).toHaveValue('Colombo');
    expect(screen.getByLabelText('Hazard Type')).toHaveValue('Flood');
  });

  it('calls set functions when inputs change', async () => {
    const filters = {
      from: '2026-09-09',
      setFrom: vi.fn(),
      to: '2026-10-09',
      setTo: vi.fn(),
      district: 'All districts',
      setDistrict: vi.fn(),
      hazardType: 'All hazards',
      setHazardType: vi.fn(),
    };

    const user = userEvent.setup();
    render(<AnalyticsFilterBar filters={filters} />);

    await user.selectOptions(screen.getByLabelText('District'), 'Kegalle');
    expect(filters.setDistrict).toHaveBeenCalledWith('Kegalle');

    await user.selectOptions(screen.getByLabelText('Hazard Type'), 'Landslide');
    expect(filters.setHazardType).toHaveBeenCalledWith('Landslide');

    fireEvent.change(screen.getByLabelText('From Date'), {
      target: { value: '2026-10-01' },
    });
    expect(filters.setFrom).toHaveBeenCalledWith('2026-10-01');

    fireEvent.change(screen.getByLabelText('To Date'), {
      target: { value: '2026-10-31' },
    });
    expect(filters.setTo).toHaveBeenCalledWith('2026-10-31');
  });
});
