import fs from 'fs';
import path from 'path';
import pkg from 'pg';
import { ENV } from './config/env.js';

const { Pool } = pkg;

const seedPath = path.resolve('database/seed-gis-courses.sql');

async function seedGISCourses() {
  const pool = new Pool({
    host: ENV.dbHost,
    port: Number(ENV.dbPort),
    database: ENV.dbName,
    user: ENV.dbUser,
    password: ENV.dbPassword
  });

  try {
    console.log(`Reading GIS seed file from: ${seedPath}`);
    const seedSql = fs.readFileSync(seedPath, 'utf8');

    console.log('Executing GIS courses seed script...');
    await pool.query(seedSql);
    
    console.log('✅ GIS courses seeded successfully!');
  } catch (err) {
    console.error('❌ Error seeding GIS courses:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedGISCourses();
