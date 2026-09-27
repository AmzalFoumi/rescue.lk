import { Inject, Injectable } from '@nestjs/common';
import { RESPONSE_REPOSITORY } from './response.repository.interface.js';
import type { ResponseRepository } from './response.repository.interface.js';

@Injectable()
export class ResponseService {
  constructor(
    @Inject(RESPONSE_REPOSITORY) private readonly responseRepository: ResponseRepository,
  ) {}

  health(): { status: string; module: string } {
    return { status: 'ok', module: 'response' };
  }

  async findAllIncidents() {
    return this.responseRepository.findAllIncidents();
  }
}
