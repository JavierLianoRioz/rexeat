import { describe, it, expect, vi, beforeEach } from "vitest";
import { processClerkEvent } from "./webhooks";
import { db, organizations, users } from "@rexeat/db";

// Mock de la base de datos
vi.mock("@rexeat/db", async () => {
  const actual = await vi.importActual("@rexeat/db");
  return {
    ...actual,
    db: {
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      onConflictDoUpdate: vi.fn().mockReturnThis(),
    },
  };
});

describe("Webhooks - processClerkEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe insertar una organización cuando se crea en Clerk", async () => {
    const data = { id: "org_123", name: "Restaurante Test" };

    await processClerkEvent({ type: "organization.created", data });

    expect(db.insert).toHaveBeenCalledWith(organizations);
    expect(db.values).toHaveBeenCalledWith({
      id: "org_123",
      businessName: "Restaurante Test",
    });
  });

  it("debe mapear el rol 'admin' de Clerk a 'owner' de Rexeat", async () => {
    const data = {
      organization: { id: "org_123" },
      public_user_data: { user_id: "user_123" },
      role: "org:admin",
    };

    await processClerkEvent({ type: "organizationMembership.created", data });

    expect(db.insert).toHaveBeenCalledWith(users);
    expect(db.values).toHaveBeenCalledWith({
      id: "user_123",
      organizationId: "org_123",
      role: "owner",
    });
  });

  it("debe mapear el rol 'member' de Clerk a 'waiter' de Rexeat", async () => {
    const data = {
      organization: { id: "org_123" },
      public_user_data: { user_id: "user_123" },
      role: "org:member",
    };

    await processClerkEvent({ type: "organizationMembership.created", data });

    expect(db.values).toHaveBeenCalledWith(
      expect.objectContaining({
        role: "waiter",
      }),
    );
  });
});
