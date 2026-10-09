import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { ActiveDispatch, RescueTeamRecord } from './rescue-team.js';
import type {
  RescueTeamsRepository,
  TeamFilter,
} from './rescue-teams.repository.interface.js';
import {
  RescueTeam,
  RescueTeamDocument,
} from './schemas/rescue-team.schema.js';
import { TeamStatus } from './team-status.js';

/** The only class that talks to MongoDB for rescue teams. */
@Injectable()
export class MongooseRescueTeamsRepository implements RescueTeamsRepository {
  constructor(
    @InjectModel(RescueTeam.name)
    private readonly model: Model<RescueTeamDocument>,
  ) {}

  async findAll(filter: TeamFilter): Promise<RescueTeamRecord[]> {
    const query: { district?: string; status?: TeamStatus } = {};
    if (filter.district) {
      query.district = filter.district;
    }
    if (filter.status) {
      query.status = filter.status;
    }
    const docs = await this.model.find(query).sort({ name: 1 }).exec();
    return docs.map((doc) => this.toRecord(doc));
  }

  async findById(id: string): Promise<RescueTeamRecord | null> {
    const doc = await this.model.findById(id).exec();
    return doc ? this.toRecord(doc) : null;
  }

  /**
   * The availability check and the write are one operation: the filter keeps
   * the status in it, so only the first of two officers can win.
   */
  async dispatch(
    id: string,
    assignment: ActiveDispatch,
  ): Promise<RescueTeamRecord | null> {
    const doc = await this.model
      .findOneAndUpdate(
        { _id: id, status: TeamStatus.Available },
        { status: TeamStatus.Dispatched, activeDispatch: assignment },
        { returnDocument: 'after' },
      )
      .exec();
    return doc ? this.toRecord(doc) : null;
  }

  async changeStatus(
    id: string,
    status: TeamStatus,
    clearAssignment: boolean,
  ): Promise<RescueTeamRecord | null> {
    const doc = await this.model
      .findByIdAndUpdate(
        id,
        clearAssignment ? { status, activeDispatch: null } : { status },
        { returnDocument: 'after' },
      )
      .exec();
    return doc ? this.toRecord(doc) : null;
  }

  // Turns a database document into the plain record the services use.
  private toRecord(doc: RescueTeamDocument): RescueTeamRecord {
    return {
      id: doc.id,
      name: doc.name,
      owner: {
        organisationId: String(doc.owner.organisationId),
        name: doc.owner.name,
        kind: doc.owner.kind,
      },
      status: doc.status,
      district: String(doc.district),
      location: {
        latitude: doc.location.latitude,
        longitude: doc.location.longitude,
      },
      activeDispatch: doc.activeDispatch
        ? {
            reportId: doc.activeDispatch.reportId,
            dispatchedBy: doc.activeDispatch.dispatchedBy,
            dispatchedAt: doc.activeDispatch.dispatchedAt,
          }
        : undefined,
    };
  }
}
