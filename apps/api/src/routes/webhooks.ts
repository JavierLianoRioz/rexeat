import { Hono } from "hono";
import { Webhook } from "svix";
import { db, organizations, users } from "@rexeat/db";
import { eq } from "drizzle-orm";
import { type UserRole, type OrganizationId } from "@rexeat/types";

const webhooks = new Hono();

const ROLE_MAP: Record<string, UserRole> = {
  "org:admin": "owner",
  "org:manager": "manager",
  "org:member": "waiter",
};

function mapClerkRole(clerkRole: string): UserRole {
  return ROLE_MAP[clerkRole] || "waiter";
}

interface ClerkEvent {
  type: string;
  data: {
    id?: string;
    name?: string;
    organization?: { id: string };
    public_user_data?: { user_id: string };
    role?: string;
  };
}

export async function processClerkEvent(evt: ClerkEvent) {
  const { type, data } = evt;

  switch (type) {
    case "organization.created": {
      const { id, name } = data;
      if (!id || !name) return;

      await db
        .insert(organizations)
        .values({ id, businessName: name })
        .onConflictDoUpdate({
          target: organizations.id,
          set: { businessName: name },
        });
      break;
    }

    case "organization.updated": {
      const { id, name } = data;
      if (!id || !name) return;

      await db
        .update(organizations)
        .set({ businessName: name })
        .where(eq(organizations.id, id));
      break;
    }

    case "organization.deleted": {
      if (!data.id) return;
      await db.delete(organizations).where(eq(organizations.id, data.id));
      break;
    }

    case "organizationMembership.created":
    case "organizationMembership.updated": {
      const { organization, public_user_data, role } = data;
      if (!organization || !public_user_data || !role) return;

      const rexeatRole = mapClerkRole(role);

      await db
        .insert(users)
        .values({
          id: public_user_data.user_id,
          organizationId: organization.id as OrganizationId,
          role: rexeatRole,
        })
        .onConflictDoUpdate({
          target: users.id,
          set: {
            organizationId: organization.id as OrganizationId,
            role: rexeatRole,
          },
        });
      break;
    }

    case "organizationMembership.deleted": {
      if (!data.public_user_data?.user_id) return;
      await db.delete(users).where(eq(users.id, data.public_user_data.user_id));
      break;
    }
  }
}

webhooks.post("/clerk", async (c) => {
  const secret = process.env["CLERK_WEBHOOK_SECRET"];
  if (!secret) return c.json({ error: "Missing secret" }, 500);

  const svix_id = c.req.header("svix-id");
  const svix_timestamp = c.req.header("svix-timestamp");
  const svix_signature = c.req.header("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return c.json({ error: "Missing headers" }, 400);
  }

  const payload = await c.req.json();
  const wh = new Webhook(secret);

  try {
    const evt = wh.verify(JSON.stringify(payload), {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as ClerkEvent;

    await processClerkEvent(evt);
    return c.json({ success: true });
  } catch {
    return c.json({ error: "Verification failed" }, 400);
  }
});

export { webhooks };
