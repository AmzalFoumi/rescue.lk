import { act, renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useWorkflowNavigation } from './useWorkflowNavigation';

const states = (result: {
  current: ReturnType<typeof useWorkflowNavigation>;
}) =>
  result.current.steps.map(
    (step) => `${step.key}:${step.state}:${step.canOpen}`,
  );

describe('useWorkflowNavigation', () => {
  it('starts on hazard monitoring with nothing selected', () => {
    const { result } = renderHook(() => useWorkflowNavigation());

    expect(result.current.state).toEqual({
      step: 'monitor',
      reportId: null,
      warningId: null,
      editor: null,
    });
    expect(states(result)).toEqual([
      'monitor:current:false',
      'review:upcoming:false',
      'level:upcoming:false',
      'area:upcoming:false',
      'delivery:upcoming:false',
    ]);
  });

  it('opens the review of a report, and monitoring can be reopened', () => {
    const { result } = renderHook(() => useWorkflowNavigation());

    act(() => result.current.openReview('r1'));

    expect(result.current.state).toMatchObject({
      step: 'review',
      reportId: 'r1',
    });
    expect(states(result).slice(0, 2)).toEqual([
      'monitor:done:true',
      'review:current:false',
    ]);
  });

  it('opens the editor on a step and lets finished steps be reopened', () => {
    const { result } = renderHook(() => useWorkflowNavigation());

    act(() => result.current.openEditor({ mode: 'create' }, 'level', 'r1'));
    act(() => result.current.goTo('area'));

    expect(result.current.state).toMatchObject({
      step: 'area',
      reportId: 'r1',
      editor: { mode: 'create' },
    });
    expect(states(result)).toEqual([
      'monitor:done:true',
      'review:done:true',
      'level:done:true',
      'area:current:false',
      'delivery:upcoming:false',
    ]);

    act(() => result.current.goTo('level'));
    expect(result.current.state.step).toBe('level');
  });

  it('does not reopen review without a report or level without an editor', () => {
    const { result } = renderHook(() => useWorkflowNavigation());

    act(() => result.current.openEditor({ mode: 'create' }, 'level', null));
    expect(states(result)[1]).toBe('review:done:false');

    act(() => result.current.goTo('review'));
    expect(result.current.state.step).toBe('level');
  });

  it('opens the delivery status of a warning and closes the editor', () => {
    const { result } = renderHook(() => useWorkflowNavigation());
    act(() =>
      result.current.openEditor(
        { mode: 'draft', warningId: 'w1' },
        'area',
        'r1',
      ),
    );

    act(() => result.current.openDelivery('w1', 'r1'));

    expect(result.current.state).toEqual({
      step: 'delivery',
      reportId: 'r1',
      warningId: 'w1',
      editor: null,
    });
    expect(states(result)[2]).toBe('level:done:false');
  });

  it('goes back to monitoring, closing the editor', () => {
    const { result } = renderHook(() => useWorkflowNavigation());
    act(() => result.current.openEditor({ mode: 'create' }, 'level', 'r1'));

    act(() => result.current.toMonitor());

    expect(result.current.state).toMatchObject({
      step: 'monitor',
      editor: null,
    });
  });

  it('ignores a step that cannot be opened', () => {
    const { result } = renderHook(() => useWorkflowNavigation());

    act(() => result.current.goTo('delivery'));

    expect(result.current.state.step).toBe('monitor');
  });
});
