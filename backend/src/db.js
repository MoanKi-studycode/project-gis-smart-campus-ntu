/**
 * Database Access Layer
 * Re-exports database functions for easy importing
 */
import { 
  getDb, 
  query, 
  connectDatabase, 
  closeDatabase, 
  healthCheck, 
  getConnectionStatus 
} from "./config/database.js";

// Main pool getter
export function getPool() {
  return getDb();
}

// Re-export all utilities
export { 
  query, 
  connectDatabase, 
  closeDatabase, 
  healthCheck, 
  getConnectionStatus 
};
