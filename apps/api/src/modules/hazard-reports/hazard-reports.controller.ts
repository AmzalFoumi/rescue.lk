import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HazardReportsService } from './hazard-reports.service.js';

@ApiTags('hazard-reports')
@Controller('hazard-reports')
export class HazardReportsController {
  constructor(private readonly hazardReportsService: HazardReportsService) {}

  @Get('health')
  health() {
    return this.hazardReportsService.health();
  }
}
