import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';

/**
 * dispatchTeam(reportId, teamId): the officer id is sent as a plain field
 * (no login yet).
 */
export class DispatchRescueTeamDto {
  @ApiProperty({
    description: 'Id of the verified hazard report being responded to',
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
  })
  @IsMongoId()
  reportId!: string;

  @ApiProperty({
    description: 'Id of the rescue team to dispatch',
    example: '6ac71f73f776c0e7b5e78e36',
  })
  @IsMongoId()
  teamId!: string;

  @ApiProperty({ example: 'officer-001' })
  @IsString()
  @IsNotEmpty()
  officerId!: string;
}
