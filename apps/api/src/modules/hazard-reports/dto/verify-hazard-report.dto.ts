import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

const MAX_REASON_LENGTH = 500;

/** verifyReport(reportId): the DMC operator id is sent as a plain field (no login yet). */
export class VerifyHazardReportDto {
  @ApiProperty({ example: 'operator-001' })
  @IsString()
  @IsNotEmpty()
  operatorId!: string;
}

/** rejectReport(reportId, reason) */
export class RejectHazardReportDto extends VerifyHazardReportDto {
  @ApiProperty({ example: 'Photo does not match the location' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_REASON_LENGTH)
  reason!: string;
}
