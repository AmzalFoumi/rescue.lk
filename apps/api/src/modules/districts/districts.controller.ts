import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { DistrictResponseDto } from './dto/district-response.dto.js';
import { DistrictsService } from './districts.service.js';

@ApiTags('districts')
@Controller('districts')
export class DistrictsController {
  constructor(private readonly districtsService: DistrictsService) {}

  @Get()
  @ApiOkResponse({ type: DistrictResponseDto, isArray: true })
  list() {
    return this.districtsService.list();
  }
}
