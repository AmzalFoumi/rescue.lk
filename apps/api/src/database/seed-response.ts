import mongoose, { Types } from 'mongoose';
import { OrganisationKind } from '../modules/response/organisation.js';
import {
  Organisation,
  OrganisationSchema,
} from '../modules/response/schemas/organisation.schema.js';
import {
  RescueTeam,
  RescueTeamSchema,
} from '../modules/response/schemas/rescue-team.schema.js';
import {
  Shelter,
  ShelterSchema,
} from '../modules/response/schemas/shelter.schema.js';

/**
 * Mock organisations, rescue teams and shelters for response coordination.
 * The case study names no real bodies, only the kinds of owner, so these are
 * plausible stand-ins chosen to cover every kind.
 */

const ORGANISATIONS: Array<{ name: string; kind: OrganisationKind }> = [
  { name: 'Sri Lanka Army', kind: OrganisationKind.ArmedForces },
  { name: 'Sri Lanka Navy', kind: OrganisationKind.ArmedForces },
  { name: 'Fire & Rescue Service', kind: OrganisationKind.Government },
  {
    name: 'District Disaster Management Unit',
    kind: OrganisationKind.Government,
  },
  { name: 'Sri Lanka Red Cross', kind: OrganisationKind.Ngo },
  { name: 'Sarvodaya', kind: OrganisationKind.Ngo },
  { name: 'Ceylon Relief Trust', kind: OrganisationKind.PrivateDonor },
];

const TEAMS: Array<{
  name: string;
  organisation: string;
  district: string;
  latitude: number;
  longitude: number;
}> = [
  {
    name: 'Army Rescue Unit 3',
    organisation: 'Sri Lanka Army',
    district: 'Kandy',
    latitude: 7.2906,
    longitude: 80.6337,
  },
  {
    name: 'Army Rescue Unit 7',
    organisation: 'Sri Lanka Army',
    district: 'Ratnapura',
    latitude: 6.6828,
    longitude: 80.3992,
  },
  {
    name: 'Navy Flood Response Team',
    organisation: 'Sri Lanka Navy',
    district: 'Colombo',
    latitude: 6.9271,
    longitude: 79.8612,
  },
  {
    name: 'Colombo Fire Brigade Team A',
    organisation: 'Fire & Rescue Service',
    district: 'Colombo',
    latitude: 6.9319,
    longitude: 79.8478,
  },
  {
    name: 'Kandy Rapid Response Unit',
    organisation: 'District Disaster Management Unit',
    district: 'Kandy',
    latitude: 7.2931,
    longitude: 80.635,
  },
  {
    name: 'Red Cross Mobile Team 1',
    organisation: 'Sri Lanka Red Cross',
    district: 'Galle',
    latitude: 6.0535,
    longitude: 80.221,
  },
  {
    name: 'Sarvodaya Volunteer Team',
    organisation: 'Sarvodaya',
    district: 'Ratnapura',
    latitude: 6.7056,
    longitude: 80.3847,
  },
];

const SHELTERS: Array<{
  name: string;
  organisation: string;
  district: string;
  capacity: number;
  currentOccupancy: number;
}> = [
  {
    name: 'Kandy Central College Hall',
    organisation: 'District Disaster Management Unit',
    district: 'Kandy',
    capacity: 400,
    currentOccupancy: 320,
  },
  {
    name: 'Peradeniya Community Centre',
    organisation: 'Sri Lanka Red Cross',
    district: 'Kandy',
    capacity: 250,
    currentOccupancy: 90,
  },
  {
    name: 'Colombo Municipal Hall',
    organisation: 'District Disaster Management Unit',
    district: 'Colombo',
    capacity: 600,
    currentOccupancy: 600,
  },
  {
    name: 'Ratnapura Temple Grounds',
    organisation: 'Sarvodaya',
    district: 'Ratnapura',
    capacity: 300,
    currentOccupancy: 45,
  },
  {
    name: 'Galle Fort School Hall',
    organisation: 'Sri Lanka Red Cross',
    district: 'Galle',
    capacity: 200,
    currentOccupancy: 160,
  },
];

/** Upserts the response coordination mock data. Districts must exist already. */
export async function seedResponse(
  districtIds: Map<string, Types.ObjectId>,
): Promise<void> {
  const OrganisationModel = mongoose.model(
    Organisation.name,
    OrganisationSchema,
  );
  const RescueTeamModel = mongoose.model(RescueTeam.name, RescueTeamSchema);
  const ShelterModel = mongoose.model(Shelter.name, ShelterSchema);

  for (const organisation of ORGANISATIONS) {
    await OrganisationModel.updateOne(
      { name: organisation.name },
      { $set: organisation },
      { upsert: true },
    );
  }
  const organisations = new Map(
    (await OrganisationModel.find().exec()).map((doc) => [
      doc.name,
      { organisationId: doc._id, name: doc.name, kind: doc.kind },
    ]),
  );

  const owner = (name: string) => {
    const found = organisations.get(name);
    if (!found) {
      throw new Error(`Unknown organisation in the seed data: ${name}`);
    }
    return found;
  };

  const district = (name: string) => {
    const found = districtIds.get(name);
    if (!found) {
      throw new Error(`Unknown district in the seed data: ${name}`);
    }
    return found;
  };

  for (const team of TEAMS) {
    await RescueTeamModel.updateOne(
      { name: team.name },
      {
        $set: {
          name: team.name,
          owner: owner(team.organisation),
          district: district(team.district),
          location: { latitude: team.latitude, longitude: team.longitude },
        },
        // Only on insert, so a seed re-run never frees a dispatched team.
        $setOnInsert: { status: 'available', activeDispatch: null },
      },
      { upsert: true },
    );
  }

  for (const shelter of SHELTERS) {
    await ShelterModel.updateOne(
      { name: shelter.name },
      {
        $set: {
          name: shelter.name,
          owner: owner(shelter.organisation),
          district: district(shelter.district),
          capacity: shelter.capacity,
        },
        $setOnInsert: { currentOccupancy: shelter.currentOccupancy },
      },
      { upsert: true },
    );
  }

  console.log(
    `Seeded ${ORGANISATIONS.length} organisations, ${TEAMS.length} rescue teams and ${SHELTERS.length} shelters.`,
  );
}
