import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { clerkMiddleware } from "@hono/clerk-auth";
import { publicMenu } from "./routes/public";
import { adminStock } from "./routes/admin";
import { aiRoutes } from "./routes/ai";

// Tipado del contexto de Hono para el proyecto Rexeat
export type HonoEnv = {
  Variables: {
    orgId: string;
    userId: string;
    jwtPayload: unknown;
  };
};

const app = new Hono<HonoEnv>().basePath("/api");

// Middleware globales
app.use("*", logger());
app.use("*", prettyJSON());
app.use("*", cors());
app.use("*", clerkMiddleware());

// Rutas
app.route("/public", publicMenu);
app.route("/admin", adminStock);
app.route("/admin", aiRoutes);

// Manejo de errores estándar según README.md
app.onError((err, c) => {
  // eslint-disable-next-line no-console
  console.error(`${err.name}: ${err.message}`);

  const status = "status" in err ? (err as number) : 500;

  // Formato estandarizado de error de Rexeat
  return c.json(
    {
      error: {
        code:
          status === 404
            ? "NOT_FOUND"
            : status === 401
              ? "UNAUTHORIZED"
              : status === 403
                ? "FORBIDDEN"
                : "INTERNAL_SERVER_ERROR",
        message: err.message || "Ha ocurrido un error inesperado",
        details:
          process.env["NODE_ENV"] === "development" ? { stack: err.stack } : {},
      },
    },
    status as any,
  ); // eslint-disable-line @typescript-eslint/no-explicit-any
});

export default app;
