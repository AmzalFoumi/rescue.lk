import { Test, TestingModule } from '@nestjs/testing';
import { describe, beforeEach, it, expect } from 'vitest';
import { WarningsController } from './warnings.controller.js';
import { WarningsService } from './warnings.service.js';

describe('WarningsController', () => {
  let controller: WarningsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WarningsController],
      providers: [{ provide: WarningsService, useValue: { health: () => ({ status: 'ok', module: 'warnings' }) } }],
    }).compile();

    controller = module.get(WarningsController);
  });

  it('is defined', () => {
    expect(controller).toBeDefined();
  });

  it('returns health status', () => {
    expect(controller.health()).toEqual({ status: 'ok', module: 'warnings' });
  });
});
