import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { isObjectId } from './object-id.js';
import { ShelterStatus, shelterStatus, toShelterView } from './shelter.js';
import type { ShelterView } from './shelter.js';
import { SHELTERS_REPOSITORY } from './shelters.repository.interface.js';
import type { SheltersRepository } from './shelters.repository.interface.js';

/**
 * Update Shelter Occupancy: people arrive at a shelter or leave it, and the
 * occupancy is always counted against the capacity.
 */
@Injectable()
export class ShelterOccupancyService {
  private readonly logger = new Logger(ShelterOccupancyService.name);

  constructor(
    @Inject(SHELTERS_REPOSITORY)
    private readonly shelters: SheltersRepository,
  ) {}

  async getById(id: string): Promise<ShelterView> {
    const shelter = isObjectId(id) ? await this.shelters.findById(id) : null;
    if (!shelter) {
      throw new NotFoundException(`Shelter ${id} not found`);
    }
    return toShelterView(shelter);
  }

  /**
   * Adds people to a shelter, or removes them with a negative number. A full
   * shelter cannot take anyone, and a shelter cannot hold fewer than nobody.
   */
  async changeOccupancy(id: string, people: number): Promise<ShelterView> {
    if (people === 0) {
      throw new BadRequestException('Give a number of people other than zero');
    }
    const shelter = await this.getById(id);
    if (people > 0 && shelter.status === ShelterStatus.Full) {
      throw new ConflictException(
        `${shelter.name} is full. Choose another shelter.`,
      );
    }
    if (people > shelter.placesAvailable) {
      throw new ConflictException(
        `${shelter.name} has ${shelter.placesAvailable} places left`,
      );
    }
    if (shelter.currentOccupancy + people < 0) {
      throw new BadRequestException(
        `${shelter.name} holds ${shelter.currentOccupancy} people`,
      );
    }

    // The repository repeats the capacity check in the write itself, so two
    // officers cannot fill the last places at the same time.
    const updated = await this.shelters.changeOccupancy(id, people);
    if (!updated) {
      throw new ConflictException(
        `${shelter.name} changed while you were working. Check it again.`,
      );
    }
    this.logger.log(
      `Shelter ${id} now holds ${updated.currentOccupancy} of ${updated.capacity} (${shelterStatus(updated)})`,
    );
    return toShelterView(updated);
  }
}
