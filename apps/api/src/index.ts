/**
 * © 2026 Rexeat - Todos los derechos reservados.
 * Este archivo está protegido bajo la licencia Polyform Non-Commercial 1.0.0.
 */
import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { clerkMiddleware } from "@hono/clerk-auth";
import { version, type ITenantRepository } from "@rexeat/db";

// Routes
import { publicMenu } from "./routes/public";
import { adminStock } from "./routes/admin";
import { aiRoutes } from "./routes/ai";
import { webhooks } from "./routes/webhooks";
import { pusherAuth } from "./routes/pusher";
import { serve } from "@hono/node-server";

/**
 * Entorno de Hono compartido en toda la aplicación.
 */
export type HonoEnv = {
  Variables: {
    orgId: string;
    userId: string;
    jwtPayload: unknown;
    repo: ITenantRepository;
  };
};

/**
 * Rexeat API - High-performance Edge Backend (OpenAPI Compliant)
 */
const app = new OpenAPIHono<HonoEnv>().basePath("/api");

// --- Seguridad Core ---
app.use("*", secureHeaders());
app.use(
  "*",
  cors({
    origin: (origin) => {
      // Permitir solo dominios de Rexeat o localhost en dev
      if (
        !origin ||
        origin.includes("localhost") ||
        origin.includes("rexeat.com")
      )
        return origin;
      return "https://rexeat.com";
    },
    credentials: true,
  }),
);

// --- Middlewares ---
app.use("*", logger());
// app.use("*", clerkMiddleware());

// --- OpenAPI Documentation ---
app.doc("/doc", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "Rexeat API",
    description: "Digital Menu System for Tourism (Edge Runtime)",
  },
});

app.get("/ui", swaggerUI({ url: "/api/doc" }));

// --- Health Check ---
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    uptime: process.uptime(),
    db_version: version,
    runtime: "edge",
  });
});

// --- Routes ---
app.route("/public", publicMenu);
app.route("/admin", adminStock);
app.route("/admin/ai", aiRoutes);
app.route("/webhooks", webhooks);
app.route("/pusher", pusherAuth);

if (process.env.NODE_ENV !== "production") {
  const port = 3001;
  console.log(`🚀 API running on http://localhost:${port}`);
  serve({
    fetch: app.fetch,
    port,
  });
}

export default app;
export type AppType = typeof app;
