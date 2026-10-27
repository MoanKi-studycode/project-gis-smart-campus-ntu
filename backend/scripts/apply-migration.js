/**
 * Script to apply database migration for adding constraints
 * Adds missing CHECK constraints to LopHoc table
 */

import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'DB_SmartCampus',
  password: '123456',
  port: 5432,
});

async function applyMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Starting migration: Add missing constraints to LopHoc...\n');
    
    // 1. Add CHECK constraint for MaTietBatDau (1-13 range)
    console.log('1️⃣ Adding CHECK constraint for MaTietBatDau (1-13)...');
    try {
      await client.query(`
        ALTER TABLE LopHoc
        ADD CONSTRAINT ck_lophoc_matietbatdau CHECK (
            MaTietBatDau IS NULL OR (MaTietBatDau >= 1 AND MaTietBatDau <= 13)
        )
      `);
      console.log('   ✅ Added ck_lophoc_matietbatdau constraint');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('   ⚠️  Constraint already exists');
      } else {
        throw error;
      }
    }
    
    // 2. Add CHECK constraint for valid period range
    console.log('2️⃣ Adding CHECK constraint for period range (start + count <= 14)...');
    try {
      await client.query(`
        ALTER TABLE LopHoc
        ADD CONSTRAINT ck_lophoc_period_range CHECK (
            (MaTietBatDau IS NULL OR SoTiet IS NULL) OR 
            (MaTietBatDau + SoTiet - 1 <= 13)
        )
      `);
      console.log('   ✅ Added ck_lophoc_period_range constraint');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('   ⚠️  Constraint already exists');
      } else {
        throw error;
      }
    }
    
    // 3. Verify all constraints
    console.log('\n📋 Verifying all constraints on LopHoc table:');
    const constraintsResult = await client.query(`
      SELECT constraint_name, constraint_type 
      FROM information_schema.table_constraints 
      WHERE table_name = 'lophoc' 
      ORDER BY constraint_name
    `);
    
    console.log(`\nFound ${constraintsResult.rows.length} constraints:`);
    constraintsResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.constraint_name} (${row.constraint_type})`);
    });
    
    // 4. Verify existing data passes constraints
    console.log('\n✅ Verifying existing data...');
    const dataCheck = await client.query(`
      SELECT 
        COUNT(*) as total_classes,
        COUNT(CASE WHEN MaTietBatDau + SoTiet - 1 > 13 THEN 1 END) as invalid_period_range,
        COUNT(CASE WHEN MaTietBatDau < 1 OR MaTietBatDau > 13 THEN 1 END) as invalid_start_period
      FROM LopHoc
      WHERE MaTietBatDau IS NOT NULL AND SoTiet IS NOT NULL
    `);
    
    const check = dataCheck.rows[0];
    console.log(`   • Total classes: ${check.total_classes}`);
    console.log(`   • Invalid period range: ${check.invalid_period_range}`);
    console.log(`   • Invalid start period: ${check.invalid_start_period}`);
    
    if (check.invalid_period_range > 0 || check.invalid_start_period > 0) {
      console.log('   ⚠️  WARNING: Some existing data violates constraints!');
    } else {
      console.log('   ✅ All existing data is valid');
    }
    
    console.log('\n✨ Migration completed successfully!\n');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

applyMigration().catch(console.error);
