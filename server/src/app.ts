import express from "express";
import cors from "cors";
import helmet from "helmet";
import { clerkMiddleware } from "@clerk/express";
import { healthRouter } from "./routes/health";
import { profileRouter } from "./routes/profile";
import { resumesRouter } from "./routes/resumes";
import { jobRolesRouter } from "./routes/jobRoles";
import { interviewsRouter } from "./routes/interviews";
import { adminRouter } from "./routes/admin";
import { attachDbUser, requireClerkAuth } from "./middleware/auth";
import { requireAdmin } from "./middleware/auth";
import { errorHandler } from "./middleware/error";

export const createApp = () => {
  const app = express();

  const corsOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:5173,http://localhost:8081")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

  const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (corsOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  };

  app.use(cors(corsOptions)); // ✅ this is enough
  app.use(helmet());
  app.use(express.json({ limit: "2mb" }));

  if (process.env.SKIP_CLERK !== "true") {
    app.use(clerkMiddleware());
  }

  app.use("/api/health", healthRouter);

  if (process.env.SKIP_CLERK !== "true") {
    app.use("/api", requireClerkAuth(), attachDbUser);
  }

  app.use("/api/profile", profileRouter);
  app.use("/api/resumes", resumesRouter);
  app.use("/api/interviews", interviewsRouter);
  app.use("/api/job-roles", jobRolesRouter);
  app.use("/api/admin", requireAdmin, adminRouter);

  app.use(errorHandler);
  return app;
};

