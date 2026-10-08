import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { HazardReportsService } from './hazard-reports.service.js';
import {
  QueuedReportResponseDto,
  SyncResponseDto,
} from './dto/queued-report-response.dto.js';
import { SubmitHazardReportDto } from './dto/submit-hazard-report.dto.js';
import {
  RejectHazardReportDto,
  VerifyHazardReportDto,
} from './dto/verify-hazard-report.dto.js';

@ApiTags('hazard-reports')
@Controller('hazard-reports')
export class HazardReportsController {
  constructor(private readonly hazardReportsService: HazardReportsService) {}

  @Get('health')
  health() {
    return this.hazardReportsService.health();
  }

  // Submit Hazard Report
  @Post()
  submit(@Body() dto: SubmitHazardReportDto) {
    return this.hazardReportsService.submit(dto);
  }

  @Post('offline')
  @ApiOkResponse({ type: QueuedReportResponseDto })
  queueOffline(@Body() dto: SubmitHazardReportDto) {
    return this.hazardReportsService.queueOffline(dto);
  }

  @Post('sync')
  @HttpCode(200)
  @ApiOkResponse({ type: SyncResponseDto })
  sync() {
    return this.hazardReportsService.syncQueued();
  }

  // Verify Hazard Report
  @Get()
  listPending() {
    // Lists reports waiting for verification (getPendingReports in the sequence diagram).
    return this.hazardReportsService.listPending();
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.hazardReportsService.getById(id);
  }

  @Patch(':id/verify')
  verify(@Param('id') id: string, @Body() dto: VerifyHazardReportDto) {
    return this.hazardReportsService.verify(id, dto.operatorId);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string, @Body() dto: RejectHazardReportDto) {
    return this.hazardReportsService.reject(id, dto.operatorId, dto.reason);
  }
}
