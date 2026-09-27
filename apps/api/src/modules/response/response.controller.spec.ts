import { Test, TestingModule } from '@nestjs/testing';
import { describe, beforeEach, it, expect } from 'vitest';
import { ResponseController } from './response.controller.js';
import { ResponseService } from './response.service.js';

describe('ResponseController', () => {
  let controller: ResponseController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResponseController],
      providers: [{ provide: ResponseService, useValue: { health: () => ({ status: 'ok', module: 'response' }) } }],
    }).compile();

    controller = module.get(ResponseController);
  });

  it('is defined', () => {
    expect(controller).toBeDefined();
  });

  it('returns health status', () => {
    expect(controller.health()).toEqual({ status: 'ok', module: 'response' });
  });
});
