import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ResponseTargetResponseDto } from './dto/response.dto.js';
import { ResponseTargetsService } from './response-targets.service.js';

@ApiTags('response')
@Controller('response')
export class ResponseController {
  constructor(private readonly targetsService: ResponseTargetsService) {}

  @Get('health')
  health() {
    return { status: 'ok', module: 'response' };
  }

  /** Step 2: the verified hazard reports that need a response. */
  @Get('reports')
  @ApiOkResponse({ type: ResponseTargetResponseDto, isArray: true })
  listReports() {
    return this.targetsService.list();
  }
}
