import express from "express";
import mainRoutes from "./routes/mainRoutes";
import env from "./helpers/config";
import { connectDB } from "./helpers/config/db";
import cookieParser from "cookie-parser";

const app = express();
const port = env.PORT;

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

app.use(express.json()); // Parse JSON bodies
app.use(cookieParser());
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

app.use("/api/v1/", mainRoutes);

// Initialize database and start server
const startServer = async () => {
  try {
    // Connect to database first
    await connectDB();

    // Then start the server
    app.listen(port, () => {
      console.log("\n🚀 =====================================");
      console.log("   Car Rental Backend Server Started");
      console.log("=====================================");
      console.log(`📍  Server: http://localhost:${port}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
