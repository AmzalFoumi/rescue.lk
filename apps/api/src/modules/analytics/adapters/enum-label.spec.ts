import { describe, it, expect } from 'vitest';
import {
  formatReliefItem,
  formatHazard,
  formatSeverity,
} from './enum-label.js';
import { ReliefItem } from '../../response/relief-distribution.js';

describe('Enum Labels', () => {
  it('formats ReliefItem', () => {
    expect(formatReliefItem(ReliefItem.Food)).toBe('Food');
    expect(formatReliefItem(ReliefItem.Medicine)).toBe('Medicine');
  });

  it('formats HazardType', () => {
    expect(formatHazard('road_blockage')).toBe('Road Blockage');
    expect(formatHazard('flood')).toBe('Flood');
  });

  it('formats WarningSeverity', () => {
    expect(formatSeverity('HIGH')).toBe('High');
    expect(formatSeverity('CRITICAL')).toBe('Critical');
  });

  it('handles empty or undefined by returning empty string', () => {
    expect(formatReliefItem('' as any)).toBe('');
  });
});
