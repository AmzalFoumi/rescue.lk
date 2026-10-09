import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { TeamStatus } from '../team-status.js';

/** updateStatus(teamId, status) from Update Team Status. */
export class UpdateTeamStatusDto {
  @ApiProperty({ enum: TeamStatus, example: TeamStatus.Returning })
  @IsEnum(TeamStatus)
  status!: TeamStatus;
}
