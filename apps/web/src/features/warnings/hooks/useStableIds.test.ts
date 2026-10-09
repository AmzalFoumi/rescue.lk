import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useStableIds } from './useStableIds';

describe('useStableIds', () => {
  it('keeps the same list while the ids stay the same', () => {
    const { result, rerender } = renderHook(
      ({ ids }: { ids: string[] }) => useStableIds(ids),
      { initialProps: { ids: ['a', 'b'] } },
    );
    const first = result.current;

    rerender({ ids: ['a', 'b'] });

    expect(result.current).toBe(first);
    expect(result.current).toEqual(['a', 'b']);
  });

  it('gives a new list when the ids change', () => {
    const { result, rerender } = renderHook(
      ({ ids }: { ids: string[] }) => useStableIds(ids),
      { initialProps: { ids: ['a'] } },
    );
    const first = result.current;

    rerender({ ids: ['a', 'c'] });

    expect(result.current).not.toBe(first);
    expect(result.current).toEqual(['a', 'c']);
  });
});
