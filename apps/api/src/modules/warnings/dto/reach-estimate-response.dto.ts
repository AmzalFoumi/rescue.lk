import { ApiProperty } from '@nestjs/swagger';
import type {
  AlertChannelType,
  ChannelReachDto,
  ReachEstimateDto,
} from '@rescue-lk/shared';
import { ALERT_CHANNEL_TYPES } from '../warnings.constants.js';

// Response DTOs for GET /warnings/reach: the expected reach of each channel for the
// selected areas, shown before a warning is sent.
// They implement the shared types, so the API and the web app agree on the shape.
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
