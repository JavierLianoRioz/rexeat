import { Hono } from "hono";
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

pusherAuth.post("/auth", zValidator("form", pusherAuthSchema), async (c) => {
  const { socket_id, channel_name } = c.req.valid("form");
  const auth = getAuth(c);

  if (!auth?.userId || !auth?.orgId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const channelOrgId = channel_name.split("public-org-")[1];

  if (channelOrgId !== auth.orgId) {
    return c.json({ error: "Forbidden: Org mismatch" }, 403);
  }

  const authResponse = pusher.authenticate(socket_id, channel_name, {
    user_id: auth.userId,
  });

  return c.json(authResponse);
});
