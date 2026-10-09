import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CircleCheck } from 'lucide-react';
import type { StepView } from '../../hooks/useWorkflowNavigation';
import { Tabs } from './Tabs';
import { WorkflowSteps } from './WorkflowSteps';

const TABS = [
  { id: 'ACTIVE', label: 'Active', icon: CircleCheck, count: 2 },
  { id: 'DRAFT', label: 'Draft', icon: CircleCheck, count: 1 },
  { id: 'CANCELLED', label: 'Cancelled', icon: CircleCheck, count: 0 },
] as const;

describe('Tabs', () => {
  const renderTabs = (selected: (typeof TABS)[number]['id'] = 'ACTIVE') => {
    const onSelect = vi.fn();
    render(
      <Tabs
        label="Warning status"
        idPrefix="t"
        tabs={TABS}
        selected={selected}
        onSelect={onSelect}
      />,
    );
    return onSelect;
  };

  it('marks the selected tab and only lets it take Tab focus', () => {
    renderTabs('DRAFT');

    const draft = screen.getByRole('tab', { name: /Draft/ });
    expect(draft).toHaveAttribute('aria-selected', 'true');
    expect(draft).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('tab', { name: /Active/ })).toHaveAttribute(
      'tabindex',
      '-1',
    );
  });

  it('moves with arrow keys, wrapping around, and Home and End', () => {
    const onSelect = renderTabs('ACTIVE');
    const active = screen.getByRole('tab', { name: /Active/ });

    fireEvent.keyDown(active, { key: 'ArrowRight' });
    fireEvent.keyDown(active, { key: 'ArrowLeft' });
    fireEvent.keyDown(active, { key: 'End' });
    fireEvent.keyDown(active, { key: 'Home' });

    expect(onSelect.mock.calls).toEqual([
      ['DRAFT'],
      ['CANCELLED'],
      ['CANCELLED'],
      ['ACTIVE'],
    ]);
    expect(document.activeElement).toBe(active);
  });

  it('shows each count', () => {
    renderTabs();

    expect(screen.getByRole('tab', { name: /Active\s*2/ })).toBeInTheDocument();
  });
});

describe('WorkflowSteps', () => {
  const steps: StepView[] = [
    {
      key: 'monitor',
      label: 'Hazard monitoring',
      number: 1,
      state: 'done',
      canOpen: true,
    },
    {
      key: 'review',
      label: 'Hazard review',
      number: 2,
      state: 'done',
      canOpen: false,
    },
    {
      key: 'level',
      label: 'Warning level',
      number: 3,
      state: 'current',
      canOpen: false,
    },
    {
      key: 'area',
      label: 'Area and message',
      number: 4,
      state: 'upcoming',
      canOpen: false,
    },
  ];

  it('marks the current step and lets only reopenable steps be clicked', () => {
    const onOpen = vi.fn();
    render(<WorkflowSteps steps={steps} onOpen={onOpen} />);

    expect(
      screen.getByRole('button', { name: /Warning level/ }),
    ).toHaveAttribute('aria-current', 'step');
    expect(
      screen.getByRole('button', { name: /Hazard review/ }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: /Area and message/ }),
    ).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: /Hazard monitoring/ }));
    expect(onOpen).toHaveBeenCalledWith('monitor');
  });

  it('tells screen readers which steps are done', () => {
    render(<WorkflowSteps steps={steps} onOpen={vi.fn()} />);

    expect(
      screen.getByRole('button', { name: 'Step 1: Hazard monitoring (done)' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Step 3: Warning level' }),
    ).toBeInTheDocument();
  });
});
