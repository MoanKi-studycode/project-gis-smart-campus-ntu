import fs from 'fs';
import path from 'path';
import pkg from 'pg';
import { ENV } from './config/env.js';

const { Pool } = pkg;

const seedPath = path.resolve('database/seed.sql');

async function seedDatabase() {
  const pool = new Pool({
    host: ENV.dbHost,
    port: Number(ENV.dbPort),
    database: ENV.dbName,
    user: ENV.dbUser,
    password: ENV.dbPassword
  });

  try {
    console.log(`Reading seed file from: ${seedPath}`);
    const seedSql = fs.readFileSync(seedPath, 'utf8');

    console.log('Executing seed script...');
    await pool.query(seedSql);
    
    console.log('✅ Database seeded successfully!');
  } catch (err) {
    console.error('❌ Error seeding database:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedDatabase();
