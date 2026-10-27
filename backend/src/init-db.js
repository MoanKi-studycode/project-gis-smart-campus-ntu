import path from "path";
import { spawn, spawnSync } from "child_process";
import { ENV } from "./config/env.js";

import pkg from "pg";
const { Pool } = pkg;

const schemaPath = path.resolve("database/schema.sql");

function buildPsqlArgs() {
  const args = [];
  if (ENV.dbHost) args.push("-h", ENV.dbHost);
  if (ENV.dbPort) args.push("-p", String(ENV.dbPort));
  if (ENV.dbUser) args.push("-U", ENV.dbUser);
  if (ENV.dbName) args.push("-d", ENV.dbName);
  args.push("-v", "ON_ERROR_STOP=1");
  args.push("-f", schemaPath);
  return args;
}

function hasPsql() {
  try {
    const res = spawnSync("psql", ["--version"], { shell: false, stdio: "ignore" });
    return res.status === 0;
  } catch {
    return false;
  }
}

function wantsReset() {
  return process.argv.includes("--reset") || process.env.DB_RESET === "1" || process.env.DB_RESET === "true";
}

async function resetDatabase() {
  const pool = new Pool({
    host: ENV.dbHost,
    port: Number(ENV.dbPort),
    database: ENV.dbName,
    user: ENV.dbUser,
    password: ENV.dbPassword
  });

  try {
    // Local-dev convenience: ensures schema.sql can be re-applied from scratch.
    // WARNING: this deletes all objects in these schemas.
    await pool.query("DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;");
    await pool.query("DROP SCHEMA IF EXISTS topology CASCADE;");
    console.log("✅ Database reset (dropped schemas public/topology)");
  } finally {
    await pool.end();
  }
}

async function applyViaPg() {
  const fs = await import("fs");
  const raw = fs.readFileSync(schemaPath, "utf8");

  // pg_dump output may include psql meta-commands (e.g. \restrict) which cannot
  // be executed via pg. Strip those lines.
  const sanitized = raw
    .split(/\r?\n/)
    .filter((line) => !line.trimStart().startsWith("\\"))
    .join("\n");

  const pool = new Pool({
    host: ENV.dbHost,
    port: Number(ENV.dbPort),
    database: ENV.dbName,
    user: ENV.dbUser,
    password: ENV.dbPassword
  });

  try {
    await pool.query(sanitized);
    console.log("✅ schema.sql applied successfully (via pg)");
  } finally {
    await pool.end();
  }
}

async function main() {
  if (!ENV.dbPassword) {
    console.warn("⚠️  DB_PASSWORD is empty. If your Postgres requires a password, set DB_PASSWORD (or PGPASSWORD).\n");
  }

  if (wantsReset()) {
    console.warn("⚠️  Reset mode enabled: dropping existing schemas before applying schema.sql");
    await resetDatabase();
  }

  console.log("Applying schema via psql:");
  console.log(`  file: ${schemaPath}`);

  if (!hasPsql()) {
    console.warn("⚠️  psql not found on PATH. Falling back to applying schema via pg (Node.js client).\n");
    await applyViaPg();
    process.exit(0);
  }

  const child = spawn("psql", buildPsqlArgs(), {
    stdio: "inherit",
    shell: true,
    env: {
      ...process.env,
      PGPASSWORD: process.env.PGPASSWORD || ENV.dbPassword || ""
    }
  });

  child.on("exit", (code) => {
    if (code === 0) {
      console.log("✅ schema.sql applied successfully (via psql)");
    } else {
      console.error(`❌ psql exited with code ${code}`);
      console.error("Tip: Ensure Postgres client tools (psql) are installed and on PATH, and that your DB user can CREATE EXTENSION postgis.");
    }
    process.exit(code ?? 1);
  });
}

main().catch((err) => {
  console.error("❌ Failed to apply schema", err);
  process.exit(1);
});
