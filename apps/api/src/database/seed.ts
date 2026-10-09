import 'dotenv/config';
import mongoose from 'mongoose';
import { District, DistrictSchema } from './schemas/district.schema.js';
import { seedResponse } from './seed-response.js';

const DISTRICTS: Array<{
  name: string;
  province: string;
  latitude: number;
  longitude: number;
}> = [
  {
    name: 'Colombo',
    province: 'Western',
    latitude: 6.9271,
    longitude: 79.8612,
  },
  {
    name: 'Gampaha',
    province: 'Western',
    latitude: 7.0873,
    longitude: 79.9925,
  },
  {
    name: 'Kalutara',
    province: 'Western',
    latitude: 6.5854,
    longitude: 79.9607,
  },
  { name: 'Kandy', province: 'Central', latitude: 7.2906, longitude: 80.6337 },
  { name: 'Matale', province: 'Central', latitude: 7.4675, longitude: 80.6234 },
  {
    name: 'Nuwara Eliya',
    province: 'Central',
    latitude: 6.9497,
    longitude: 80.7891,
  },
  { name: 'Galle', province: 'Southern', latitude: 6.0535, longitude: 80.221 },
  { name: 'Matara', province: 'Southern', latitude: 5.9549, longitude: 80.555 },
  {
    name: 'Hambantota',
    province: 'Southern',
    latitude: 6.1241,
    longitude: 81.1185,
  },
  {
    name: 'Jaffna',
    province: 'Northern',
    latitude: 9.6615,
    longitude: 80.0255,
  },
  {
    name: 'Batticaloa',
    province: 'Eastern',
    latitude: 7.7102,
    longitude: 81.6924,
  },
  {
    name: 'Trincomalee',
    province: 'Eastern',
    latitude: 8.5874,
    longitude: 81.2152,
  },
  {
    name: 'Kurunegala',
    province: 'North Western',
    latitude: 7.4863,
    longitude: 80.3623,
  },
  {
    name: 'Anuradhapura',
    province: 'North Central',
    latitude: 8.3114,
    longitude: 80.4037,
  },
  {
    name: 'Ratnapura',
    province: 'Sabaragamuwa',
    latitude: 6.6828,
    longitude: 80.3992,
  },
];

async function seed(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      'MONGODB_URI is not set. Copy apps/api/.env.example to apps/api/.env first.',
    );
  }

  await mongoose.connect(uri);
  const DistrictModel = mongoose.model(District.name, DistrictSchema);

  for (const district of DISTRICTS) {
    await DistrictModel.updateOne(
      { name: district.name },
      { $set: district },
      { upsert: true },
    );
  }

  console.log(`Seeded ${DISTRICTS.length} districts.`);

  const districtIds = new Map(
    (await DistrictModel.find().exec()).map((doc) => [doc.name, doc._id]),
  );
  await seedResponse(districtIds);

  await mongoose.disconnect();
}

seed().catch((error: unknown) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
