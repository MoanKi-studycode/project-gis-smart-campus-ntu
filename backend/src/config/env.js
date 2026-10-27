import dotenv from "dotenv";

dotenv.config();

export const ENV = {
  dbHost: process.env.DB_HOST || "localhost",
  dbPort: process.env.DB_PORT || "5432",
  dbName: process.env.DB_NAME || "DB_SmartCampus",
  dbUser: process.env.DB_USER || "postgres",
  dbPassword: process.env.DB_PASSWORD || "",
  port: process.env.PORT || 4000
};
