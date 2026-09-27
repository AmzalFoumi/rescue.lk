import 'dotenv/config';
import mongoose from 'mongoose';
import { District, DistrictSchema } from './schemas/district.schema.js';

const DISTRICTS: Array<{ name: string; province: string }> = [
  { name: 'Colombo', province: 'Western' },
  { name: 'Gampaha', province: 'Western' },
  { name: 'Kalutara', province: 'Western' },
  { name: 'Kandy', province: 'Central' },
  { name: 'Matale', province: 'Central' },
  { name: 'Nuwara Eliya', province: 'Central' },
  { name: 'Galle', province: 'Southern' },
  { name: 'Matara', province: 'Southern' },
  { name: 'Hambantota', province: 'Southern' },
  { name: 'Jaffna', province: 'Northern' },
  { name: 'Batticaloa', province: 'Eastern' },
  { name: 'Trincomalee', province: 'Eastern' },
  { name: 'Kurunegala', province: 'North Western' },
  { name: 'Anuradhapura', province: 'North Central' },
  { name: 'Ratnapura', province: 'Sabaragamuwa' },
];

async function seed(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set. Copy apps/api/.env.example to apps/api/.env first.');
  }

  await mongoose.connect(uri);
  const DistrictModel = mongoose.model(District.name, DistrictSchema);

  for (const district of DISTRICTS) {
    await DistrictModel.updateOne({ name: district.name }, { $set: district }, { upsert: true });
  }

  console.log(`Seeded ${DISTRICTS.length} districts.`);
  await mongoose.disconnect();
}

seed().catch((error: unknown) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
