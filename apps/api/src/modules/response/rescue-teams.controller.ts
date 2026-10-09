import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  RescueTeamResponseDto,
  TeamAvailabilityResponseDto,
} from './dto/response.dto.js';
import { UpdateTeamStatusDto } from './dto/update-team-status.dto.js';
import { ResourceAvailabilityService } from './resource-availability.service.js';
import { TeamStatus } from './team-status.js';
import { TeamStatusService } from './team-status.service.js';

@ApiTags('response')
@Controller('response/teams')
export class RescueTeamsController {
  constructor(
    private readonly availabilityService: ResourceAvailabilityService,
    private readonly statusService: TeamStatusService,
  ) {}

  /** Step 5, Check Resource Availability: every organisation's teams in one list. */
  @Get()
  @ApiQuery({ name: 'district', required: false })
  @ApiQuery({ name: 'status', required: false, enum: TeamStatus })
  @ApiOkResponse({ type: TeamAvailabilityResponseDto })
  list(
    @Query('district') district?: string,
    @Query('status') status?: TeamStatus,
  ) {
    return this.availabilityService.listTeams({ district, status });
  }

  @Get(':id')
  @ApiOkResponse({ type: RescueTeamResponseDto })
  @ApiNotFoundResponse({ description: 'No team with this id' })
  getById(@Param('id') id: string) {
    return this.statusService.getById(id);
  }

  /** Update Team Status, used by the team while it is working. */
  @Patch(':id/status')
  @ApiOkResponse({ type: RescueTeamResponseDto })
  @ApiNotFoundResponse({ description: 'No team with this id' })
  @ApiConflictResponse({ description: 'The team cannot take this status' })
  changeStatus(@Param('id') id: string, @Body() dto: UpdateTeamStatusDto) {
    return this.statusService.changeStatus(id, dto.status);
  }
}
