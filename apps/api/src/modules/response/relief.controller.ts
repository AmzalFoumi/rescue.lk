import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { LogReliefDistributionDto } from './dto/log-relief-distribution.dto.js';
import { ReliefDistributionResponseDto } from './dto/response.dto.js';
import { ReliefDistributionService } from './relief-distribution.service.js';

@ApiTags('response')
@Controller('response/relief')
export class ReliefController {
  constructor(private readonly reliefService: ReliefDistributionService) {}

  @Get()
  @ApiQuery({ name: 'district', required: false })
  @ApiOkResponse({ type: ReliefDistributionResponseDto, isArray: true })
  list(@Query('district') district?: string) {
    return this.reliefService.list(district);
  }

  /** Allocate Relief Resources: food, water and medicine as they go out. */
  @Post()
  @ApiCreatedResponse({ type: ReliefDistributionResponseDto })
  @ApiBadRequestResponse({ description: 'A field is missing or invalid' })
  log(@Body() dto: LogReliefDistributionDto) {
    return this.reliefService.log(dto);
  }
}
