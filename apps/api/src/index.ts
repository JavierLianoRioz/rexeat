import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { clerkMiddleware } from "@hono/clerk-auth";
import { publicMenu } from "./routes/public";
import { adminStock } from "./routes/admin";
import { aiRoutes } from "./routes/ai";
import { webhooks } from "./routes/webhooks";

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
app.use("*", cors());

app.route("/webhooks", webhooks);

app.use("*", clerkMiddleware());

app.route("/public", publicMenu);
app.route("/admin", adminStock);
app.route("/admin", aiRoutes);

app.onError((err: Error, c: Context) => {
  // eslint-disable-next-line no-console
  console.error(`${err.name}: ${err.message}`);

  const status = "status" in err ? (err as any).status : 500;

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
  );
});

export default app;
