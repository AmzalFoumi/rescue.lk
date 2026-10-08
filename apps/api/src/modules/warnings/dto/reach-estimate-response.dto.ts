import { ApiProperty } from '@nestjs/swagger';
import type {
  AlertChannelType,
  ChannelReachDto,
  ReachEstimateDto,
} from '@rescue-lk/shared';
import { ALERT_CHANNEL_TYPES } from '../warnings.constants.js';

export class ChannelReachResponseDto implements ChannelReachDto {
  @ApiProperty({ enum: ALERT_CHANNEL_TYPES, example: 'SMS' })
  channel!: AlertChannelType;

  @ApiProperty({
    description: 'People for SMS and push, siren towers for SIREN',
    example: 240000,
  })
  recipients!: number;
}

export class ReachEstimateResponseDto implements ReachEstimateDto {
  @ApiProperty({ type: [String], example: ['Ratnapura', 'Kalutara'] })
  districts!: string[];

  @ApiProperty({ type: [ChannelReachResponseDto] })
  channels!: ChannelReachResponseDto[];
}
