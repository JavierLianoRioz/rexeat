import { Hono, type Context } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { getAuth } from "@hono/clerk-auth";
import { pusher } from "../lib/pusher";
import type { HonoEnv } from "../index";

export const pusherAuth = new Hono<HonoEnv>();

const pusherAuthSchema = z.object({
  socket_id: z.string(),
  channel_name: z.string(),
});

pusherAuth.post(
  "/auth",
  zValidator("form", pusherAuthSchema),
  async (c: Context<HonoEnv>) => {
    const { socket_id, channel_name } = c.req.valid("form");
    const auth = getAuth(c);

    if (!auth?.userId) return c.json({ error: "Unauthorized" }, 401);

    // Validar acceso al canal private-org-{orgId}
    // const channelId = channel_name.replace("private-org-", "");

    // TODO: Validar membresía real en la tabla de miembros

    const authResponse = pusher.authenticate(socket_id, channel_name, {
      user_id: auth.userId,
    });

    return c.json(authResponse);
  },
);
