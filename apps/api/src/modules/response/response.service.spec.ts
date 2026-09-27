import { Test, TestingModule } from '@nestjs/testing';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { ResponseService } from './response.service.js';
import { RESPONSE_REPOSITORY, ResponseRepository } from './response.repository.interface.js';

describe('ResponseService', () => {
  let service: ResponseService;
  const mockRepository: ResponseRepository = {
    findAllIncidents: vi.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ResponseService, { provide: RESPONSE_REPOSITORY, useValue: mockRepository }],
    }).compile();

    service = module.get(ResponseService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  it('reports health', () => {
    expect(service.health()).toEqual({ status: 'ok', module: 'response' });
  });

  it('delegates findAllIncidents to the repository', async () => {
    await service.findAllIncidents();
    expect(mockRepository.findAllIncidents).toHaveBeenCalled();
  });
});
