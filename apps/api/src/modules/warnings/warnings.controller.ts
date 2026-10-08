import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type {
  DeliveryRecordDto,
  ReachEstimateDto,
  TargetAreaDto,
  VerifiedHazardReportDto,
  WarningDeliveryResultDto,
  WarningDto,
} from '@rescue-lk/shared';
import { WarningsService } from './warnings.service.js';
import { toSubmitWarningCommand, toWarningContent } from './warnings.mapper.js';
import { ApiErrorResponses } from './warnings.swagger.js';
import { HealthResponseDto } from './dto/health-response.dto.js';
import { SubmitWarningDto } from './dto/submit-warning.dto.js';
import { UpdateWarningDto } from './dto/update-warning.dto.js';
import { CancelWarningDto } from './dto/cancel-warning.dto.js';
import { ListWarningsQueryDto } from './dto/list-warnings-query.dto.js';
import {
  DeliveryRecordIdParamDto,
  WarningIdParamDto,
} from './dto/id-params.dto.js';
import { WarningResponseDto } from './dto/warning-response.dto.js';
import { WarningDeliveryResultResponseDto } from './dto/warning-delivery-result-response.dto.js';
import { DeliveryRecordResponseDto } from './dto/delivery-record-response.dto.js';
import { VerifiedHazardReportResponseDto } from './dto/verified-hazard-report-response.dto.js';
import { TargetAreaResponseDto } from './dto/target-area-response.dto.js';
import { ReachQueryDto } from './dto/reach-query.dto.js';
import { ReachEstimateResponseDto } from './dto/reach-estimate-response.dto.js';

// Thin HTTP adapter: maps requests to WarningsService calls, nothing else.
// Static routes are declared before the :id routes.
@ApiTags('warnings')
@Controller('warnings')
export class WarningsController {
  constructor(private readonly warningsService: WarningsService) {}

  @Get('health')
  @ApiOkResponse({ type: HealthResponseDto })
  health() {
    return this.warningsService.health();
  }

  @Get('verified-reports')
  @ApiOperation({ summary: 'List verified hazard reports a warning can use' })
  @ApiOkResponse({ type: [VerifiedHazardReportResponseDto] })
  listVerifiedReports(): Promise<VerifiedHazardReportDto[]> {
    return this.warningsService.listVerifiedReports();
  }

  @Get('target-areas')
  @ApiOperation({ summary: 'List the districts and river basins to target' })
  @ApiOkResponse({ type: [TargetAreaResponseDto] })
  listTargetAreas(): TargetAreaDto[] {
    return this.warningsService.listTargetAreas();
  }

  @Get('reach')
  @ApiOperation({
    summary: 'Estimate the reach of each channel for the selected areas',
  })
  @ApiOkResponse({ type: ReachEstimateResponseDto })
  @ApiErrorResponses(HttpStatus.BAD_REQUEST)
  estimateReach(@Query() { areaIds }: ReachQueryDto): ReachEstimateDto {
    return this.warningsService.estimateReach(areaIds);
  }

  @Get()
  @ApiOperation({ summary: 'List warnings, newest first' })
  @ApiOkResponse({ type: [WarningResponseDto] })
  @ApiErrorResponses(HttpStatus.BAD_REQUEST)
  list(@Query() { status }: ListWarningsQueryDto): Promise<WarningDto[]> {
    return this.warningsService.list(status);
  }

  @Post('drafts')
  @ApiOperation({
    summary: 'Save a draft (new, or edit the DRAFT given by draftId)',
  })
  @ApiCreatedResponse({ type: WarningResponseDto })
  @ApiErrorResponses(
    HttpStatus.BAD_REQUEST,
    HttpStatus.NOT_FOUND,
    HttpStatus.CONFLICT,
    HttpStatus.UNPROCESSABLE_ENTITY,
  )
  saveDraft(@Body() body: SubmitWarningDto): Promise<WarningDto> {
    return this.warningsService.saveDraft(toSubmitWarningCommand(body));
  }

  @Post('publish')
  @ApiOperation({
    summary:
      'Publish a new warning, or the DRAFT given by draftId, and send it',
  })
  @ApiCreatedResponse({ type: WarningDeliveryResultResponseDto })
  @ApiErrorResponses(
    HttpStatus.BAD_REQUEST,
    HttpStatus.NOT_FOUND,
    HttpStatus.CONFLICT,
    HttpStatus.UNPROCESSABLE_ENTITY,
  )
  publish(@Body() body: SubmitWarningDto): Promise<WarningDeliveryResultDto> {
    return this.warningsService.publish(toSubmitWarningCommand(body));
  }

  @Post('deliveries/:recordId/retry')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retry a FAILED delivery once' })
  @ApiOkResponse({ type: DeliveryRecordResponseDto })
  @ApiErrorResponses(
    HttpStatus.BAD_REQUEST,
    HttpStatus.NOT_FOUND,
    HttpStatus.CONFLICT,
  )
  retryDelivery(
    @Param() { recordId }: DeliveryRecordIdParamDto,
  ): Promise<DeliveryRecordDto> {
    return this.warningsService.retryDelivery(recordId);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update an ACTIVE warning (new version) and send it again',
  })
  @ApiOkResponse({ type: WarningDeliveryResultResponseDto })
  @ApiErrorResponses(
    HttpStatus.BAD_REQUEST,
    HttpStatus.NOT_FOUND,
    HttpStatus.CONFLICT,
    HttpStatus.UNPROCESSABLE_ENTITY,
  )
  update(
    @Param() { id }: WarningIdParamDto,
    @Body() body: UpdateWarningDto,
  ): Promise<WarningDeliveryResultDto> {
    return this.warningsService.update({
      warningId: id,
      content: toWarningContent(body),
    });
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel an ACTIVE warning with a reason' })
  @ApiOkResponse({ type: WarningResponseDto })
  @ApiErrorResponses(
    HttpStatus.BAD_REQUEST,
    HttpStatus.NOT_FOUND,
    HttpStatus.CONFLICT,
  )
  cancel(
    @Param() { id }: WarningIdParamDto,
    @Body() { reason }: CancelWarningDto,
  ): Promise<WarningDto> {
    return this.warningsService.cancel({ warningId: id, reason });
  }

  @Get(':id/deliveries')
  @ApiOperation({
    summary: 'Delivery status per channel for the current version',
  })
  @ApiOkResponse({ type: [DeliveryRecordResponseDto] })
  @ApiErrorResponses(HttpStatus.BAD_REQUEST, HttpStatus.NOT_FOUND)
  latestDeliveries(
    @Param() { id }: WarningIdParamDto,
  ): Promise<DeliveryRecordDto[]> {
    return this.warningsService.latestDeliveries(id);
  }
}
