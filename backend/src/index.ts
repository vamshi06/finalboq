import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import boqRoutes from "./routes/boq.route";
import conversationRoutes from "./routes/conversation.route";
import rateCardRoutes from "./routes/rateCard.route";
import fs from "fs";
import path from "path";

dotenv.config();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("📁 Created uploads directory:", uploadsDir);
}

const app = express();

/**
 * ✅ CORS for Render + local — allow any *.onrender.com and localhost
 */
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://ai-boq-generator.onrender.com",
];

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  // Allow any Render frontend (e.g. https://your-app.onrender.com)
  if (origin.endsWith(".onrender.com")) return true;
  return false;
}

app.use(
  cors({
    origin: function (origin, callback) {
      if (isAllowedOrigin(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const { method, url } = req;

  res.on("finish", () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    const logLevel = statusCode >= 500 ? "❌" : statusCode >= 400 ? "⚠️" : "✅";
    console.log(`${logLevel} ${method} ${url} ${statusCode} - ${duration}ms`);
  });

  next();
});

// ✅ Static uploads (optional)
app.use("/uploads", express.static("uploads"));

// ✅ API Routes
app.use("/api/boq", boqRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/rate-card", rateCardRoutes);

// ✅ Root route (so GET / does not show Not Found)
app.get("/", (_req: Request, res: Response) => {
  res.json({
    ok: true,
    name: "BOQ Generator API",
    timestamp: new Date().toISOString(),
  });
});

// ✅ Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.method} ${req.url} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  console.error("🔥 Global error handler caught:", {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  const statusCode = err.statusCode || err.status || 500;
  const isDevelopment = process.env.NODE_ENV !== "production";

  res.status(statusCode).json({
    error: err.message || "Internal Server Error",
    ...(isDevelopment && { stack: err.stack }),
    timestamp: new Date().toISOString(),
  });
});

// ✅ IMPORTANT: Render provides PORT automatically
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`\n🚀 Backend server started successfully!`);
  console.log(`📡 Listening on: ${port}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`⏰ Started at: ${new Date().toLocaleString()}\n`);
});
