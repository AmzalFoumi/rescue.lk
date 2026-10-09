import { describe, it, expect } from 'vitest';
import { formatCount, formatDateTime, formatTime, shortId } from './format';

describe('format', () => {
  it('shows dates and times in Sri Lanka time', () => {
    expect(formatDateTime('2026-10-08T04:20:00.000Z')).toBe('8 Oct, 09:50');
    expect(formatTime(new Date('2026-10-08T04:20:00.000Z'))).toBe('09:50');
  });

  it('shows a dash for a missing date', () => {
    expect(formatDateTime(null)).toBe('—');
  });

  it('groups thousands', () => {
    expect(formatCount(240000)).toBe('240,000');
  });

  it('shortens ids to a prefix and the last characters', () => {
    expect(shortId('W', '665f1b2c9d3e4a0012345670')).toBe('W-345670');
    expect(shortId('R', '665f1b2c9d3e4a00000000a1')).toBe('R-0000A1');
  });
});

describe('warning text', () => {
  it('names the hazard, using the typed name for the other hazard', async () => {
    const { hazardName } = await import('./format');
    expect(hazardName({ hazard: 'flood', otherHazard: '' })).toBe('Flood');
    expect(hazardName({ hazard: 'other', otherHazard: 'Dam breach' })).toBe(
      'Dam breach',
    );
    expect(hazardName({ hazard: 'other', otherHazard: '' })).toBe('Other');
  });

  it('lists area names, falling back to the id', async () => {
    const { areaSummary } = await import('./format');
    expect(areaSummary(['B-KALU', 'X'], { 'B-KALU': 'Kalu Ganga basin' })).toBe(
      'Kalu Ganga basin, X',
    );
    expect(areaSummary([], {})).toBe('No area yet');
  });
});

describe('cancelDescription', () => {
  it('explains what cancelling a warning does', async () => {
    const { cancelDescription } = await import('./format');

    expect(
      cancelDescription(
        { hazard: 'flood', otherHazard: '', areaIds: ['B-KALU'] },
        { 'B-KALU': 'Kalu Ganga basin' },
        ['Ratnapura', 'Kalutara'],
      ),
    ).toBe(
      'Flood warning for Kalu Ganga basin. It will be removed from the Citizen App for Ratnapura, Kalutara. This cannot be undone.',
    );
  });
});
