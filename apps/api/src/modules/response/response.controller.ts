import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ResponseService } from './response.service.js';

@ApiTags('response')
@Controller('response')
export class ResponseController {
  constructor(private readonly responseService: ResponseService) {}

  @Get('health')
  health() {
    return this.responseService.health();
  }
}
