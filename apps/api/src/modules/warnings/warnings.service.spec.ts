import { Test, TestingModule } from '@nestjs/testing';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { WarningsService } from './warnings.service.js';
import {
  WARNINGS_REPOSITORY,
  WarningsRepository,
} from './warnings.repository.interface.js';

describe('WarningsService', () => {
  let service: WarningsService;
  const mockRepository: WarningsRepository = {
    create: vi.fn(),
    findById: vi.fn().mockResolvedValue(null),
    findAll: vi.fn().mockResolvedValue([]),
    updateStatus: vi.fn().mockResolvedValue(null),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WarningsService,
        { provide: WARNINGS_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    service = module.get(WarningsService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  it('reports health', () => {
    expect(service.health()).toEqual({ status: 'ok', module: 'warnings' });
  });

  it('delegates findAll to the repository', async () => {
    await service.findAll();
    expect(mockRepository.findAll).toHaveBeenCalled();
  });
});
