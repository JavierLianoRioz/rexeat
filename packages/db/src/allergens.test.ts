import { describe, it, expect, beforeEach } from "vitest";
import { sql } from "drizzle-orm";
import { createDb, TenantRepository, organizations, products } from "./index";

describe("TenantRepository - Allergen Safety", () => {
  let testDb: any;
  const ORG_A = "org_alfa";
  const ORG_B = "org_beta";

  beforeEach(async () => {
    testDb = createDb();

    const tables = [
      `CREATE TABLE IF NOT EXISTS organizations (id TEXT PRIMARY KEY, business_name TEXT, created_at INTEGER)`,
      `CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, organization_id TEXT, name TEXT, description TEXT, price INTEGER, allergens TEXT, allergens_confirmed INTEGER DEFAULT 0, status TEXT, image TEXT, created_at INTEGER, updated_at INTEGER)`,
    ];

    for (const table of tables) {
      testDb.run(sql.raw(table));
    }

    await testDb.insert(organizations).values([
      { id: ORG_A, businessName: "Restaurante Alfa" },
      { id: ORG_B, businessName: "Taberna Beta" },
    ]);
  });

  describe("confirmAllergens", () => {
    it("should set allergensConfirmed to true and update allergens", async () => {
      const repo = new TenantRepository(ORG_A, testDb);
      const prodId = "p1";

      await testDb.insert(products).values({
        id: prodId,
        organizationId: ORG_A,
        name: { es: "Plato A" },
        price: 1000,
        allergens: {},
        allergensConfirmed: false,
        status: "in_stock",
      });

      const updated = await repo.confirmAllergens(prodId, { gluten: true });
      expect(updated.allergensConfirmed).toBe(true);
      expect(updated.allergens).toEqual({ gluten: true });
    });

    it("should fail if product belongs to another tenant", async () => {
      const repoA = new TenantRepository(ORG_A, testDb);
      const prodIdB = "pB";

      await testDb.insert(products).values({
        id: prodIdB,
        organizationId: ORG_B,
        name: { es: "Plato B" },
        price: 2000,
        allergens: {},
        allergensConfirmed: false,
        status: "in_stock",
      });

      await expect(
        repoA.confirmAllergens(prodIdB, { gluten: true }),
      ).rejects.toThrow("Product not found");
    });
  });
});
