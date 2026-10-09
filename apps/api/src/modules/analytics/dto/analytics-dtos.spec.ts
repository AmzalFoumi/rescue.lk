import { describe, it, expect } from 'vitest';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ExportReportDto } from './export-report.dto.js';
import { GenerateReportDto } from './generate-report.dto.js';
import { HealthResponseDto } from './health-response.dto.js';

describe('Analytics DTOs', () => {
  it('valid ExportReportDto passes', async () => {
    const obj = {
      from: '2026-10-01T00:00:00Z',
      to: '2026-10-02T00:00:00Z',
      type: 'ALERT_TIMELINE',
      format: 'CSV',
    };
    const dto = plainToInstance(ExportReportDto, obj);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('valid GenerateReportDto with optional fields passes', async () => {
    const obj = {
      from: '2026-10-01T00:00:00Z',
      to: '2026-10-02T00:00:00Z',
      type: 'CITIZENS_REACHED',
      hazardType: 'Flood',
      district: 'Colombo',
    };
    const dto = plainToInstance(GenerateReportDto, obj);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('invalid date fails', async () => {
    const obj = {
      from: 'not-a-date',
      to: '2026-10-02T00:00:00Z',
      type: 'ALERT_TIMELINE',
      format: 'CSV',
    };
    const dto = plainToInstance(ExportReportDto, obj);
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('from');
  });

  it('invalid type fails', async () => {
    const obj = {
      from: '2026-10-01T00:00:00Z',
      to: '2026-10-02T00:00:00Z',
      type: 'UNKNOWN_TYPE',
      format: 'CSV',
    };
    const dto = plainToInstance(ExportReportDto, obj);
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('type');
  });

  it('invalid format fails', async () => {
    const obj = {
      from: '2026-10-01T00:00:00Z',
      to: '2026-10-02T00:00:00Z',
      type: 'ALERT_TIMELINE',
      format: 'XLSX',
    };
    const dto = plainToInstance(ExportReportDto, obj);
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('format');
  });

  it('valid HealthResponseDto passes', () => {
    const dto = new HealthResponseDto();
    dto.status = 'ok';
    dto.module = 'analytics';
    expect(dto.status).toBe('ok');
    expect(dto.module).toBe('analytics');
  });
});
