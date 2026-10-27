/**
 * =====================================================
 * DATABASE CONNECTION LAYER
 * NTU Smart Campus - Production-Ready PostgreSQL Pool
 * =====================================================
 * 
 * Features:
 * - Connection Pooling for high-frequency requests
 * - Automatic reconnection on failure
 * - Query logging with execution duration
 * - Graceful error handling
 * 
 * Schema Tables:
 * - VaiTro (Roles)
 * - Khoa (Faculties), Nganh (Majors)
 * - NguoiDung (Users - Students/Lecturers/Admin)
 * - ToaNha (Buildings), PhongHoc (Rooms)
 * - MonHoc (Subjects), LopHoc (Class Sections)
 * - LopHoc_SinhVien (Enrollments)
 * - SuKien (Events)
 * - PhienDiemDanh (Attendance Sessions)
 * - KetQuaDiemDanh (Attendance Records)
 * - TietHoc (Academic Periods)
 */

import { ENV } from "./env.js";
import pkg from "pg";
const { Pool } = pkg;

// ============ CONFIGURATION ============
const POOL_CONFIG = {
  host: ENV.dbHost,
  port: Number(ENV.dbPort),
  database: ENV.dbName,
  user: ENV.dbUser,
  password: ENV.dbPassword,
  
  // Connection Pool Settings (optimized for high-frequency)
  max: 20,                    // Maximum connections in pool
  min: 5,                     // Minimum idle connections
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 10000, // Timeout for new connection
  
  // Keep connections alive (critical for real-time features)
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  
  // Statement timeout (prevent long-running queries)
  statement_timeout: 30000,   // 30 seconds max per query
};

// ============ STATE ============
let pool = null;
let isConnected = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000; // 3 seconds

// ============ LOGGING UTILITIES ============
const LOG_PREFIX = {
  INFO: '\x1b[36m[DB]\x1b[0m',      // Cyan
  SUCCESS: '\x1b[32m[DB]\x1b[0m',   // Green
  ERROR: '\x1b[31m[DB]\x1b[0m',     // Red
  WARN: '\x1b[33m[DB]\x1b[0m',      // Yellow
  QUERY: '\x1b[35m[QUERY]\x1b[0m',  // Magenta
};

function log(type, message, ...args) {
  const timestamp = new Date().toISOString().split('T')[1].slice(0, 12);
  console.log(`${timestamp} ${LOG_PREFIX[type]} ${message}`, ...args);
}

// ============ POOL EVENT HANDLERS ============
function setupPoolEvents(poolInstance) {
  // Connection acquired from pool
  poolInstance.on('connect', (client) => {
    log('INFO', 'New client connected to pool');
    isConnected = true;
    reconnectAttempts = 0;
  });

  // Client returned to pool
  poolInstance.on('acquire', () => {
    // Silent - too verbose for production
  });

  // Client removed from pool (idle timeout)
  poolInstance.on('remove', () => {
    log('INFO', 'Client removed from pool (idle)');
  });

  // CRITICAL: Handle unexpected errors
  poolInstance.on('error', async (err, client) => {
    log('ERROR', 'Unexpected pool error:', err.message);
    isConnected = false;
    
    // Don't exit - attempt graceful reconnection
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      log('WARN', `Attempting reconnection (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
      
      setTimeout(async () => {
        try {
          await healthCheck();
          log('SUCCESS', 'Reconnection successful!');
        } catch (e) {
          log('ERROR', 'Reconnection failed:', e.message);
        }
      }, RECONNECT_DELAY);
    } else {
      log('ERROR', 'Max reconnection attempts reached. Manual intervention required.');
    }
  });
}

// ============ CONNECT DATABASE ============
export async function connectDatabase() {
  if (pool && isConnected) {
    log('INFO', 'Using existing database connection');
    return pool;
  }

  try {
    log('INFO', `Connecting to PostgreSQL at ${ENV.dbHost}:${ENV.dbPort}/${ENV.dbName}...`);
    
    pool = new Pool(POOL_CONFIG);
    setupPoolEvents(pool);

    // Test connection with simple query
    const result = await pool.query('SELECT NOW() as server_time, current_database() as db_name');
    const { server_time, db_name } = result.rows[0];
    
    isConnected = true;
    log('SUCCESS', `✅ Database connected: ${db_name}`);
    log('INFO', `   Server time: ${new Date(server_time).toLocaleString('vi-VN')}`);
    log('INFO', `   Pool size: ${POOL_CONFIG.min}-${POOL_CONFIG.max} connections`);
    
    return pool;
  } catch (error) {
    isConnected = false;
    log('ERROR', '❌ Database connection failed:', error.message);
    
    // Provide helpful error messages
    if (error.code === 'ECONNREFUSED') {
      log('ERROR', '   → Is PostgreSQL running? Check: sudo service postgresql status');
    } else if (error.code === '28P01') {
      log('ERROR', '   → Invalid password. Check DB_PASSWORD in .env');
    } else if (error.code === '3D000') {
      log('ERROR', `   → Database "${ENV.dbName}" not found. Create it first.`);
    }
    
    throw error;
  }
}

// ============ GET POOL (with lazy initialization) ============
export function getDb() {
  if (!pool) {
    throw new Error('Database not initialized. Call connectDatabase() first.');
  }
  return pool;
}

// ============ QUERY WRAPPER (with logging & timing) ============
/**
 * Execute a query with automatic timing and error handling
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @param {object} options - { silent: boolean, name: string }
 * @returns {Promise<QueryResult>}
 */
export async function query(text, params = [], options = {}) {
  const { silent = false, name = 'Query' } = options;
  
  if (!pool) {
    throw new Error('Database not connected');
  }

  const start = Date.now();
  
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Log slow queries (> 100ms)
    if (!silent) {
      if (duration > 100) {
        log('WARN', `⚠️  Slow query (${duration}ms): ${name}`);
      } else if (duration > 50) {
        log('QUERY', `${name} - ${duration}ms (${result.rowCount} rows)`);
      }
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    log('ERROR', `Query failed after ${duration}ms: ${error.message}`);
    log('ERROR', `   SQL: ${text.substring(0, 100)}...`);
    throw error;
  }
}

// ============ HEALTH CHECK ============
export async function healthCheck() {
  try {
    const result = await pool.query('SELECT 1 as health');
    isConnected = result.rows[0].health === 1;
    return isConnected;
  } catch (error) {
    isConnected = false;
    throw error;
  }
}

// ============ CONNECTION STATUS ============
export function getConnectionStatus() {
  return {
    isConnected,
    poolSize: pool ? pool.totalCount : 0,
    idleCount: pool ? pool.idleCount : 0,
    waitingCount: pool ? pool.waitingCount : 0,
  };
}

// ============ GRACEFUL SHUTDOWN ============
export async function closeDatabase() {
  if (pool) {
    log('INFO', 'Closing database connections...');
    await pool.end();
    pool = null;
    isConnected = false;
    log('SUCCESS', 'Database connections closed');
  }
}

// Note: Process signal handlers (SIGINT, SIGTERM) should be handled 
// in the main server.js file, not here, to avoid conflicts with
// application-level shutdown logic.
