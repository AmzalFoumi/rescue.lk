import { describe, it, expect } from 'vitest';
import type {
  DeliveryRecordDto,
  ReachEstimateDto,
  WarningDto,
} from '@rescue-lk/shared';
import {
  auditTimeline,
  deliveryKpis,
  percentLabel,
  recipientsLabel,
} from './delivery';

const reach: ReachEstimateDto = {
  districts: ['Ratnapura', 'Kalutara'],
  channels: [
    { channel: 'SMS', recipients: 240000 },
    { channel: 'PUSH', recipients: 80000 },
    { channel: 'SIREN', recipients: 16 },
  ],
};

const record = (overrides: Partial<DeliveryRecordDto>): DeliveryRecordDto => ({
  id: 'd1',
  warningId: 'w1',
  warningVersion: 1,
  channel: 'SMS',
  status: 'SENT',
  attempts: 1,
  recipients: 240000,
  lastAttemptAt: '2026-10-08T05:11:00.000Z',
  error: '',
  ...overrides,
});

describe('deliveryKpis', () => {
  it('counts people reached by SMS and push; sirens are not people', () => {
    const records = [
      record({ channel: 'SMS', status: 'SENT' }),
      record({ id: 'd2', channel: 'PUSH', status: 'RETRYING' }),
      record({ id: 'd3', channel: 'SIREN', status: 'FAILED' }),
    ];

    expect(deliveryKpis(records, ['SMS', 'PUSH', 'SIREN'], reach)).toEqual({
      target: 320000,
      delivered: 240000,
      pending: 80000,
      failed: 0,
    });
  });

  it('counts a failed people channel as failed', () => {
    expect(
      deliveryKpis([record({ status: 'FAILED' })], ['SMS'], reach),
    ).toMatchObject({ target: 240000, failed: 240000, delivered: 0 });
  });

  it('is zero before the estimate arrives', () => {
    expect(deliveryKpis([record({})], ['SMS'], null)).toEqual({
      target: 0,
      delivered: 0,
      pending: 0,
      failed: 0,
    });
  });
});

describe('percentLabel', () => {
  it('gives one decimal of the target, or nothing without a target', () => {
    expect(percentLabel(80000, 240000)).toBe(' (33.3%)');
    expect(percentLabel(5, 0)).toBe('');
  });
});

describe('recipientsLabel', () => {
  it('shows people or sirens once sent, a dash before', () => {
    expect(recipientsLabel(record({}))).toBe('240,000 people');
    expect(recipientsLabel(record({ channel: 'SIREN', recipients: 16 }))).toBe(
      '16 sirens',
    );
    expect(recipientsLabel(record({ status: 'FAILED' }))).toBe('–');
  });
});

describe('auditTimeline', () => {
  const warning = {
    id: '665f1b2c9d3e4a0012345670',
    status: 'ACTIVE',
    severity: 'HIGH',
    areaIds: [],
    createdBy: 'Officer',
    createdAt: '2026-10-08T05:00:00.000Z',
    publishedAt: '2026-10-08T05:10:00.000Z',
    updatedAt: null,
    cancelledAt: null,
  } as unknown as WarningDto;

  it('adds the final result of each channel to the warning events', () => {
    const events = auditTimeline(
      warning,
      [
        record({ attempts: 2 }),
        record({
          id: 'd2',
          channel: 'SIREN',
          status: 'FAILED',
          attempts: 3,
          recipients: 0,
          lastAttemptAt: '2026-10-08T05:12:00.000Z',
        }),
        record({
          id: 'd3',
          channel: 'PUSH',
          status: 'QUEUED',
          lastAttemptAt: null,
        }),
      ],
      {},
    );

    expect(events.map((event) => event.text)).toEqual([
      'Public siren: Failed after 3 attempts.',
      'SMS: Sent after 2 attempts, 240,000 people.',
      'W-345670 published as High for No area yet.',
      'W-345670 created by Officer.',
    ]);
    expect(events[0].kind).toBe('failed');
  });
});

describe('buildDeliveryView', () => {
  it('gathers the warning, its records, KPIs, timeline and subtitle', async () => {
    const { buildDeliveryView } = await import('./delivery');
    const warning = {
      id: 'w1',
      status: 'ACTIVE',
      severity: 'HIGH',
      version: 2,
      areaIds: ['B-KALU'],
      channels: ['SMS'],
      createdBy: 'Officer',
      createdAt: '2026-10-08T05:00:00.000Z',
      publishedAt: null,
      updatedAt: null,
      cancelledAt: null,
    } as unknown as WarningDto;

    const view = buildDeliveryView('w1', {
      warnings: [warning],
      records: [record({})],
      reach,
      areas: [
        {
          id: 'B-KALU',
          kind: 'RIVER_BASIN',
          name: 'Kalu Ganga basin',
          districts: ['Ratnapura', 'Kalutara'],
        },
      ],
    });

    expect(view?.warning).toBe(warning);
    expect(view?.subtitle).toBe(
      'Kalu Ganga basin · Ratnapura, Kalutara · version 2',
    );
    expect(view?.kpis.delivered).toBe(240000);
    expect(view?.timeline.length).toBeGreaterThan(0);
  });

  it('is null until the warning is loaded', async () => {
    const { buildDeliveryView } = await import('./delivery');

    expect(
      buildDeliveryView('w9', { warnings: [], records: [], reach, areas: [] }),
    ).toBeNull();
  });
});
