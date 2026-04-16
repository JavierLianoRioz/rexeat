/**
 * © 2026 Rexeat - Todos los derechos reservados.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { db, organizations, users } from "@rexeat/db";
import { processClerkEvent } from "./webhooks";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

describe("Clerk Webhooks - Integration", () => {
  beforeAll(async () => {
    // Crear tablas básicas para el test (Drizzle Kit Push manual)
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS organizations (
        id TEXT PRIMARY KEY,
        business_name TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL REFERENCES organizations(id),
        role TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);
  });

  it("debería crear una organización cuando recibe organization.created", async () => {
    const event = {
      type: "organization.created",
      data: {
        id: "org_test_123",
        name: "Restaurante Test",
      },
    };

    await processClerkEvent(event);

    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, "org_test_123"));

    expect(org).toBeDefined();
    expect(org?.businessName).toBe("Restaurante Test");
  });

  it("debería sincronizar un miembro cuando recibe organizationMembership.created", async () => {
    const event = {
      type: "organizationMembership.created",
      data: {
        organization: { id: "org_test_123" },
        public_user_data: { user_id: "user_test_456" },
        role: "org:admin",
      },
    };

    await processClerkEvent(event);

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, "user_test_456"));

    expect(user).toBeDefined();
    expect(user?.organizationId).toBe("org_test_123");
    expect(user?.role).toBe("owner");
  });
});
