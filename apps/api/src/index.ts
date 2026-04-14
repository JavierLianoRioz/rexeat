import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { clerkMiddleware } from "@hono/clerk-auth";
import { publicMenu } from "./routes/public";
import { adminStock } from "./routes/admin";
import { aiRoutes } from "./routes/ai";
import { webhooks } from "./routes/webhooks";
import { pusherAuth } from "./routes/pusher";

export type HonoEnv = {
  Variables: {
    orgId: string;
    userId: string;
    jwtPayload: unknown;
  };
};

const app = new Hono<HonoEnv>().basePath("/api");

app.use("*", logger());
app.use("*", prettyJSON());

app.use("*", async (c, next) => {
  const allowedOrigins = process.env["ALLOWED_ORIGINS"]?.split(",") || [];
  const corsMiddleware = cors({
    origin: (origin) => {
      if (process.env["NODE_ENV"] === "development") return "*";
      return allowedOrigins.includes(origin) ? origin : allowedOrigins[0] || "";
    },
    credentials: true,
  });
  return corsMiddleware(c, next);
});

app.route("/webhooks", webhooks);

app.use("*", clerkMiddleware());

app.route("/public", publicMenu);
app.route("/admin", adminStock);
app.route("/admin", aiRoutes);
app.route("/pusher", pusherAuth);

app.onError((err: Error, c: Context) => {
  // eslint-disable-next-line no-console
  console.error(`${err.name}: ${err.message}`);

  const status = "status" in err ? (err.status as number) : 500;

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
    (status >= 400 && status < 600 ? status : 500) as 500,
  );
});

export default app;
