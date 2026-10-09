import { ApiProperty } from '@nestjs/swagger';

// HealthResponseDto is the answer of GET /warnings/health, documented in Swagger, so
// a quick check shows the module is running.
export class HealthResponseDto {
  @ApiProperty({ example: 'ok' })
  status!: string;

  @ApiProperty({ example: 'warnings' })
  module!: string;
}
