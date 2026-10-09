import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReportTypeCard } from './ReportTypeCard';

describe('ReportTypeCard', () => {
  it('displays the title and description for the report type', () => {
    render(
      <ReportTypeCard
        type="CITIZENS_REACHED"
        isSelected={false}
        onSelect={() => {}}
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'Citizens Reached' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Notification delivery statistics'),
    ).toBeInTheDocument();
  });

  it('calls onSelect when clicked', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();

    render(
      <ReportTypeCard
        type="CITIZENS_REACHED"
        isSelected={false}
        onSelect={onSelect}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Citizens Reached/ }));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('applies the selected styles when isSelected is true', () => {
    render(
      <ReportTypeCard
        type="CITIZENS_REACHED"
        isSelected={true}
        onSelect={() => {}}
      />,
    );

    const button = screen.getByRole('button', { name: /Citizens Reached/ });
    expect(button.className).toContain('border-primary');
  });
});
