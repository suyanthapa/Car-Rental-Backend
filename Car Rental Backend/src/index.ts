import express from "express";
import mainRoutes from "./routes/mainRoutes";
import env from "./helpers/config";
import { connectDB } from "./helpers/config/db";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

const app = express();

const port = env.PORT;

//SECURE HTTP HEADERS
app.use(helmet());

// RATE LIMITING
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: "Too many requests, please try again later.",
});

app.use("/api", limiter);

// BODY PARSERS
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// REQUEST LOGGING
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

// MAIN ROUTES
app.use("/api/v1/", mainRoutes);

//If someone hits an invalid API: 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

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
