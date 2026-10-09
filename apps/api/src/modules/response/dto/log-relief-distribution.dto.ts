import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { OrganisationKind } from '../organisation.js';
import { ReliefItem } from '../relief-distribution.js';

// A single delivery never records more than this many units.
const MAX_QUANTITY = 1_000_000;

/** The organisation that supplied the relief. */
export class OwnerDto {
  @ApiProperty({ example: '65f1a2b3c4d5e6f7a8b9c0d1' })
  @IsMongoId()
  organisationId!: string;

  @ApiProperty({ example: 'Sri Lanka Red Cross' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ enum: OrganisationKind, example: OrganisationKind.Ngo })
  @IsEnum(OrganisationKind)
  kind!: OrganisationKind;
}

/** logDistribution(item, quantity, district) from Allocate Relief Resources. */
export class LogReliefDistributionDto {
  @ApiProperty({ enum: ReliefItem, example: ReliefItem.Water })
  @IsEnum(ReliefItem)
  item!: ReliefItem;

  @ApiProperty({ example: 500 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_QUANTITY)
  quantity!: number;

  @ApiProperty({
    description: 'District id the supplies went to',
    example: '65f1a2b3c4d5e6f7a8b9c0d1',
  })
  @IsMongoId()
  district!: string;

  @ApiProperty({ type: OwnerDto })
  @ValidateNested()
  @Type(() => OwnerDto)
  owner!: OwnerDto;
}
