import app from "./app.js";
import { connectDatabase } from "./config/database.js";
import { ENV } from "./config/env.js";

const PORT = process.env.PORT || 4000;
const HOST = '0.0.0.0';

async function startServer() {
  try {
    await connectDatabase();
    console.log("✅ Database connected");

    app.listen(PORT, HOST, () => {
      console.log(`🚀 Server is running at http://localhost:${PORT}`);
      console.log(`   Bound to ${HOST}:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Cannot connect database:", err);
    process.exit(1);
  }
}

startServer();
