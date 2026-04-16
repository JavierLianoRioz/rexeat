/**
 * © 2026 Rexeat - Todos los derechos reservados.
 * Este archivo está protegido bajo la licencia Polyform Non-Commercial 1.0.0.
 */
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { clerkMiddleware } from "@hono/clerk-auth";
import { version, type TenantRepository } from "@rexeat/db";

// Routes
import { publicMenu } from "./routes/public";
import { adminStock } from "./routes/admin";
import { aiRoutes } from "./routes/ai";
import { webhooks } from "./routes/webhooks";
import { pusherAuth } from "./routes/pusher";

/**
 * Entorno de Hono compartido en toda la aplicación.
 */
export type HonoEnv = {
  Variables: {
    orgId: string;
    userId: string;
    jwtPayload: any;
    repo: TenantRepository;
  };
};

/**
 * Rexeat API - High-performance Edge Backend
 */
const app = new Hono<HonoEnv>().basePath("/api");

// --- Middlewares ---
app.use("*", logger());
app.use("*", cors());

// Clerk middleware global (necesario para las rutas protegidas)
app.use("*", clerkMiddleware());

// --- Health Check ---
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    uptime: process.uptime(),
    db_version: version,
    runtime: "edge",
  });
});

// --- Public Routes ---
app.route("/public", publicMenu);

// --- Admin & Protected Routes ---
app.route("/admin", adminStock);
app.route("/admin/ai", aiRoutes);

// --- Webhooks ---
app.route("/webhooks", webhooks);

// --- Pusher Auth ---
app.route("/pusher", pusherAuth);

export default app;
