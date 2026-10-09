import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DispatchService } from './dispatch.service.js';
import { DispatchRescueTeamDto } from './dto/dispatch-rescue-team.dto.js';
import {
  DispatchConfirmationResponseDto,
  DispatchResponseDto,
} from './dto/response.dto.js';

@ApiTags('response')
@Controller('response/dispatches')
export class DispatchesController {
  constructor(private readonly dispatchService: DispatchService) {}

  /** Steps 6 to 8 of Dispatch Rescue Team. */
  @Post()
  @ApiCreatedResponse({ type: DispatchConfirmationResponseDto })
  @ApiNotFoundResponse({ description: 'No verified report or no such team' })
  @ApiConflictResponse({
    description: 'The team was assigned elsewhere in the meantime',
  })
  dispatch(@Body() dto: DispatchRescueTeamDto) {
    return this.dispatchService.dispatch(
      dto.reportId,
      dto.teamId,
      dto.officerId,
    );
  }

  /** The teams already sent to one report. */
  @Get('report/:reportId')
  @ApiOkResponse({ type: DispatchResponseDto, isArray: true })
  @ApiNotFoundResponse({ description: 'No report with this id' })
  listForReport(@Param('reportId') reportId: string) {
    return this.dispatchService.listForReport(reportId);
  }
}
