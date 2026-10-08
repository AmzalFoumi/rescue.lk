import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { HazardReportSubmissionService } from './hazard-report-submission.service.js';
import { HazardReportVerificationService } from './hazard-report-verification.service.js';
import {
  QueuedReportResponseDto,
  SyncResponseDto,
} from './dto/queued-report-response.dto.js';
import { HazardReportResponseDto } from './dto/hazard-report-response.dto.js';
import { SubmitHazardReportDto } from './dto/submit-hazard-report.dto.js';
import {
  RejectHazardReportDto,
  VerifyHazardReportDto,
} from './dto/verify-hazard-report.dto.js';

@ApiTags('hazard-reports')
@Controller('hazard-reports')
export class HazardReportsController {
  constructor(
    private readonly submissionService: HazardReportSubmissionService,
    private readonly verificationService: HazardReportVerificationService,
  ) {}

  @Get('health')
  health() {
    return { status: 'ok', module: 'hazard-reports' };
  }

  // Submit Hazard Report
  @Post()
  @ApiCreatedResponse({ type: HazardReportResponseDto })
  @ApiBadRequestResponse({ description: 'A field is missing or invalid' })
  submit(@Body() dto: SubmitHazardReportDto) {
    return this.submissionService.submit(dto);
  }

  @Post('offline')
  @ApiCreatedResponse({ type: QueuedReportResponseDto })
  @ApiBadRequestResponse({ description: 'A field is missing or invalid' })
  queueOffline(@Body() dto: SubmitHazardReportDto) {
    return this.submissionService.queueOffline(dto);
  }

  @Post('sync')
  @HttpCode(200)
  @ApiOkResponse({ type: SyncResponseDto })
  sync() {
    return this.submissionService.syncQueued();
  }

  // Verify Hazard Report
  @Get()
  @ApiOkResponse({ type: HazardReportResponseDto, isArray: true })
  listPending() {
    // Lists reports waiting for verification (getPendingReports in the sequence diagram).
    return this.verificationService.listPending();
  }

  @Get(':id')
  @ApiOkResponse({ type: HazardReportResponseDto })
  @ApiNotFoundResponse({ description: 'No report with this id' })
  getById(@Param('id') id: string) {
    return this.verificationService.getById(id);
  }

  @Patch(':id/verify')
  @ApiOkResponse({ type: HazardReportResponseDto })
  @ApiNotFoundResponse({ description: 'No report with this id' })
  @ApiConflictResponse({
    description: 'The report is not pending verification',
  })
  verify(@Param('id') id: string, @Body() dto: VerifyHazardReportDto) {
    return this.verificationService.verify(id, dto.operatorId);
  }

  @Patch(':id/reject')
  @ApiOkResponse({ type: HazardReportResponseDto })
  @ApiBadRequestResponse({ description: 'The reason is missing' })
  @ApiNotFoundResponse({ description: 'No report with this id' })
  @ApiConflictResponse({
    description: 'The report is not pending verification',
  })
  reject(@Param('id') id: string, @Body() dto: RejectHazardReportDto) {
    return this.verificationService.reject(id, dto.operatorId, dto.reason);
  }
}
