import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AppHeader } from './AppHeader';

describe('AppHeader', () => {
  it('shows the brand and the signed-in officer', () => {
    render(<AppHeader />);

    const banner = screen.getByRole('banner');
    expect(within(banner).getByText('rescue.lk')).toBeInTheDocument();
    expect(
      within(banner).getByText('Disaster Management Centre · Sri Lanka'),
    ).toBeInTheDocument();
    expect(within(banner).getByText('S. Wickramasinghe')).toBeInTheDocument();
    expect(within(banner).getByText('Assessment Officer')).toBeInTheDocument();
  });

  it('groups the main navigation by use case', () => {
    render(<AppHeader />);

    const nav = screen.getByRole('navigation', { name: 'Main' });
    const groups = within(nav).getAllByRole('group');
    expect(groups.map((group) => group.getAttribute('aria-label'))).toEqual([
      'UC1 Warning Management',
      'UC2 Hazard Reporting',
      'UC3 Response Coordination',
      'UC4 Disaster Analytics',
    ]);
  });

  it('links to the UC1 screen as the current page', () => {
    render(<AppHeader />);

    const current = screen.getByRole('link', { name: 'Warning Management' });
    expect(current).toHaveAttribute('href', '/warnings');
    expect(current).toHaveAttribute('aria-current', 'page');
  });

  it('locks screens the Assessment Officer role cannot use', () => {
    render(<AppHeader />);

    expect(screen.getAllByRole('link')).toHaveLength(1);
    for (const label of [
      'Citizen App',
      'Verify Reports',
      'Response Operations',
      'Analytics & Reports',
    ]) {
      const item = screen.getByText(label).parentElement;
      expect(item).toHaveAttribute('aria-disabled', 'true');
      expect(item).toHaveAttribute(
        'title',
        'Not available for the Assessment Officer role',
      );
    }
  });

  it('keeps language and large text as static, disabled controls', () => {
    render(<AppHeader />);

    const language = screen.getByRole('combobox', { name: 'Language' });
    expect(language).toBeDisabled();
    expect(language).toHaveValue('en');
    expect(
      within(language)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['English', 'සිංහල', 'தமிழ்']);
    expect(screen.getByRole('button', { name: 'Large text' })).toBeDisabled();
  });
});
