import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrganisationKind } from '../organisation.js';
import { ReliefItem } from '../relief-distribution.js';
import { ShelterStatus } from '../shelter.js';
import { TeamStatus } from '../team-status.js';

/** How the API answers; these classes exist to document Swagger. */

export class OwnerResponseDto {
  @ApiProperty({ example: '65f1a2b3c4d5e6f7a8b9c0d1' })
  organisationId!: string;

  @ApiProperty({ example: 'Sri Lanka Army' })
  name!: string;

  @ApiProperty({
    enum: OrganisationKind,
    example: OrganisationKind.ArmedForces,
  })
  kind!: OrganisationKind;
}

export class LocationResponseDto {
  @ApiProperty({ example: 6.9271 })
  latitude!: number;

  @ApiProperty({ example: 79.8612 })
  longitude!: number;
}

export class ActiveDispatchResponseDto {
  @ApiProperty({ example: '65f1a2b3c4d5e6f7a8b9c0d1' })
  reportId!: string;

  @ApiProperty({ example: 'officer-001' })
  dispatchedBy!: string;

  @ApiProperty({ example: '2026-10-09T10:00:00.000Z' })
  dispatchedAt!: Date;
}

export class RescueTeamResponseDto {
  @ApiProperty({ example: '6ac71f73f776c0e7b5e78e36' })
  id!: string;

  @ApiProperty({ example: 'Army Rescue Unit 3' })
  name!: string;

  @ApiProperty({ type: OwnerResponseDto })
  owner!: OwnerResponseDto;

  @ApiProperty({ enum: TeamStatus, example: TeamStatus.Available })
  status!: TeamStatus;

  @ApiProperty({ description: 'District id' })
  district!: string;

  @ApiProperty({ type: LocationResponseDto })
  location!: LocationResponseDto;

  @ApiPropertyOptional({ type: ActiveDispatchResponseDto })
  activeDispatch?: ActiveDispatchResponseDto;
}

export class TeamAvailabilityResponseDto {
  @ApiProperty({ type: RescueTeamResponseDto, isArray: true })
  teams!: RescueTeamResponseDto[];

  @ApiProperty({
    description: 'Zero means no team is available, so no dispatch is made',
    example: 2,
  })
  availableCount!: number;
}

export class ResponseTargetResponseDto {
  @ApiProperty({ example: '65f1a2b3c4d5e6f7a8b9c0d1' })
  id!: string;

  @ApiProperty({ example: 'flood' })
  hazardType!: string;

  @ApiProperty({ example: 'Water is rising on Main Street' })
  description!: string;

  @ApiProperty({ description: 'District id' })
  district!: string;

  @ApiProperty({ type: LocationResponseDto })
  location!: LocationResponseDto;

  @ApiProperty({ example: '2026-10-09T09:00:00.000Z' })
  capturedAt!: Date;

  @ApiProperty({ example: 0 })
  dispatchedTeams!: number;

  @ApiProperty({ example: true })
  needsResponse!: boolean;
}

export class DispatchResponseDto {
  @ApiProperty({ example: '6ac71f73f776c0e7b5e78e36' })
  id!: string;

  @ApiProperty({ example: '65f1a2b3c4d5e6f7a8b9c0d1' })
  reportId!: string;

  @ApiProperty({ example: '6ac71f73f776c0e7b5e78e36' })
  teamId!: string;

  @ApiProperty({ example: 'Army Rescue Unit 3' })
  teamName!: string;

  @ApiProperty({ type: OwnerResponseDto })
  owner!: OwnerResponseDto;

  @ApiProperty({ description: 'District id' })
  district!: string;

  @ApiProperty({ example: 'officer-001' })
  dispatchedBy!: string;

  @ApiProperty({ example: '2026-10-09T10:00:00.000Z' })
  dispatchedAt!: Date;
}

export class DispatchConfirmationResponseDto {
  @ApiProperty({ type: DispatchResponseDto })
  dispatch!: DispatchResponseDto;

  @ApiProperty({ type: RescueTeamResponseDto })
  team!: RescueTeamResponseDto;
}

export class ShelterResponseDto {
  @ApiProperty({ example: '6ac71f73f776c0e7b5e78e36' })
  id!: string;

  @ApiProperty({ example: 'Kandy Central College Hall' })
  name!: string;

  @ApiProperty({ type: OwnerResponseDto })
  owner!: OwnerResponseDto;

  @ApiProperty({ description: 'District id' })
  district!: string;

  @ApiProperty({ example: 400 })
  capacity!: number;

  @ApiProperty({ example: 320 })
  currentOccupancy!: number;

  @ApiProperty({ enum: ShelterStatus, example: ShelterStatus.NearlyFull })
  status!: ShelterStatus;

  @ApiProperty({ example: 80 })
  placesAvailable!: number;
}

export class ReliefDistributionResponseDto {
  @ApiProperty({ example: '6ac71f73f776c0e7b5e78e36' })
  id!: string;

  @ApiProperty({ enum: ReliefItem, example: ReliefItem.Water })
  item!: ReliefItem;

  @ApiProperty({ example: 500 })
  quantity!: number;

  @ApiProperty({ description: 'District id' })
  district!: string;

  @ApiProperty({ type: OwnerResponseDto })
  owner!: OwnerResponseDto;

  @ApiProperty({ example: '2026-10-09T10:00:00.000Z' })
  distributedAt!: Date;
}
