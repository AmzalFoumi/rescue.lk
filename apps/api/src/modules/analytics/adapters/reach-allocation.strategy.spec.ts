import { describe, it, expect } from 'vitest';
import { EqualSplitReachAllocation } from './reach-allocation.strategy.js';

describe('EqualSplitReachAllocation', () => {
  const strategy = new EqualSplitReachAllocation();

  it.each([
    {
      total: 100,
      districts: ['A', 'B'],
      expected: { A: 50, B: 50 },
      desc: 'even split',
    },
    {
      total: 10,
      districts: ['A', 'B', 'C'],
      expected: { A: 4, B: 3, C: 3 },
      desc: 'remainder spread',
    },
    { total: 100, districts: [], expected: {}, desc: 'empty list' },
    {
      total: 0,
      districts: ['A', 'B'],
      expected: { A: 0, B: 0 },
      desc: 'total 0',
    },
    { total: 50, districts: ['A'], expected: { A: 50 }, desc: 'one district' },
    {
      total: 2,
      districts: ['A', 'B', 'C'],
      expected: { A: 1, B: 1, C: 0 },
      desc: 'total smaller than district count',
    },
  ])(
    'should return correct allocation when $desc',
    ({ total, districts, expected }) => {
      const res = strategy.allocate(total, districts);

      // Assert exactly the expected map values
      for (const [key, val] of Object.entries(expected)) {
        expect(res.get(key)).toBe(val);
      }
      expect(res.size).toBe(Object.keys(expected).length);

      // Parts sum to total
      const sum = Array.from(res.values()).reduce((a, b) => a + b, 0);
      if (districts.length > 0) {
        expect(sum).toBe(total);
      } else {
        expect(sum).toBe(0);
      }
    },
  );
});
