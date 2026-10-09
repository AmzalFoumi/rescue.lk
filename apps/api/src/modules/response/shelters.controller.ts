import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ShelterResponseDto } from './dto/response.dto.js';
import { UpdateOccupancyDto } from './dto/update-occupancy.dto.js';
import { ResourceAvailabilityService } from './resource-availability.service.js';
import { ShelterOccupancyService } from './shelter-occupancy.service.js';

@ApiTags('response')
@Controller('response/shelters')
export class SheltersController {
  constructor(
    private readonly availabilityService: ResourceAvailabilityService,
    private readonly occupancyService: ShelterOccupancyService,
  ) {}

  @Get()
  @ApiQuery({ name: 'district', required: false })
  @ApiOkResponse({ type: ShelterResponseDto, isArray: true })
  list(@Query('district') district?: string) {
    return this.availabilityService.listShelters(district);
  }

  @Get(':id')
  @ApiOkResponse({ type: ShelterResponseDto })
  @ApiNotFoundResponse({ description: 'No shelter with this id' })
  getById(@Param('id') id: string) {
    return this.occupancyService.getById(id);
  }

  /** Update Shelter Occupancy. A full shelter cannot take anyone. */
  @Patch(':id/occupancy')
  @ApiOkResponse({ type: ShelterResponseDto })
  @ApiBadRequestResponse({ description: 'The number of people is not usable' })
  @ApiNotFoundResponse({ description: 'No shelter with this id' })
  @ApiConflictResponse({ description: 'The shelter has no room for them' })
  changeOccupancy(@Param('id') id: string, @Body() dto: UpdateOccupancyDto) {
    return this.occupancyService.changeOccupancy(id, dto.people);
  }
}
