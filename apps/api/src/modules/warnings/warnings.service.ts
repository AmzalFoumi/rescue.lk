import { Inject, Injectable } from '@nestjs/common';
import { WARNINGS_REPOSITORY } from './warnings.repository.interface.js';
import type { WarningsRepository } from './warnings.repository.interface.js';

@Injectable()
export class WarningsService {
  constructor(
    @Inject(WARNINGS_REPOSITORY) private readonly warningsRepository: WarningsRepository,
  ) {}

  health(): { status: string; module: string } {
    return { status: 'ok', module: 'warnings' };
  }

  async findAll() {
    return this.warningsRepository.findAll();
  }
}
