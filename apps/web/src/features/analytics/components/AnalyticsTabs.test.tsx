import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnalyticsTabs } from './AnalyticsTabs';
import { useDemoRole } from '../context/DemoRoleContext';

vi.mock('../context/DemoRoleContext', () => ({
  useDemoRole: vi.fn(),
}));

describe('AnalyticsTabs', () => {
  beforeEach(() => {
    vi.mocked(useDemoRole).mockReturnValue({
      role: 'DMC_ADMIN',
      setRole: vi.fn(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders tabs based on the role', () => {
    render(<AnalyticsTabs activeTab="overview" onTabChange={() => {}} />);
    expect(screen.getByRole('tab', { name: /Overview/i })).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: /Alerts & Reach/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: /Shelter Occupancy/i }),
    ).toBeInTheDocument();
  });

  it('does not render shelters tab for DONOR_ORGANISATION', () => {
    vi.mocked(useDemoRole).mockReturnValue({
      role: 'DONOR_ORGANISATION',
      setRole: vi.fn(),
    });
    render(<AnalyticsTabs activeTab="overview" onTabChange={() => {}} />);

    expect(
      screen.queryByRole('tab', { name: /Shelter Occupancy/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Overview/i })).toBeInTheDocument();
  });

  it('calls onTabChange when a tab is clicked', async () => {
    const onTabChange = vi.fn();
    const user = userEvent.setup();
    render(<AnalyticsTabs activeTab="overview" onTabChange={onTabChange} />);

    await user.click(screen.getByRole('tab', { name: /Alerts & Reach/i }));
    expect(onTabChange).toHaveBeenCalledWith('alertsReach');
  });

  it('applies the selected styles to the active tab', () => {
    render(<AnalyticsTabs activeTab="overview" onTabChange={() => {}} />);

    const activeTab = screen.getByRole('tab', { name: /Overview/i });
    expect(activeTab).toHaveAttribute('aria-selected', 'true');
    expect(activeTab.className).toContain('text-primary');

    const inactiveTab = screen.getByRole('tab', { name: /Alerts & Reach/i });
    expect(inactiveTab).toHaveAttribute('aria-selected', 'false');
    expect(inactiveTab.className).toContain('text-ink-muted');
  });
});
