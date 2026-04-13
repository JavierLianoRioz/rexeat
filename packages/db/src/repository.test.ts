import { describe, it, expect, beforeEach } from "vitest";
import { sql, eq } from "drizzle-orm";
import {
  createDb,
  TenantRepository,
  organizations,
  products,
  type AppDatabase,
} from "./index";
import { type OrganizationId } from "@rexeat/types";

describe("TenantRepository - Aislamiento y Actualización", () => {
  let testDb: AppDatabase;
  const ORG_A = "org_test_a" as OrganizationId;
  const ORG_B = "org_test_b" as OrganizationId;
  const PROD_ID = "prod_test_1";

  beforeEach(async () => {
    testDb = createDb(":memory:");

    const tables = [
      `CREATE TABLE IF NOT EXISTS organizations (id TEXT PRIMARY KEY, business_name TEXT, created_at INTEGER)`,
      `CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, organization_id TEXT, name TEXT, description TEXT, price INTEGER, allergens TEXT, allergens_confirmed INTEGER DEFAULT 0, status TEXT, image TEXT, created_at INTEGER, updated_at INTEGER)`,
    ];

    for (const table of tables) {
      testDb.run(sql.raw(table));
    }

    // Setup de organizaciones
    await testDb.insert(organizations).values([
      { id: ORG_A, businessName: "Org A" },
      { id: ORG_B, businessName: "Org B" },
    ]);

    // Insertar producto base para Org A
    await testDb.insert(products).values({
      id: PROD_ID,
      organizationId: ORG_A,
      name: { es: "Producto Original" },
      price: 1000,
      allergens: {},
      status: "in_stock",
    });
  });

  it("GREEN: debe actualizar un producto de su propia organización", async () => {
    const repoA = new TenantRepository(ORG_A, testDb);
    const updated = await repoA.updateProduct(PROD_ID, {
      price: 1500,
      allergensConfirmed: true,
    });

    expect(updated.price).toBe(1500);
    expect(updated.allergensConfirmed).toBe(true);
  });

  it("GREEN: NO debe permitir actualizar un producto de otra organización", async () => {
    const repoB = new TenantRepository(ORG_B, testDb);

    // El repoB intenta actualizar el producto que pertenece a Org A
    await expect(repoB.updateProduct(PROD_ID, { price: 9999 })).rejects.toThrow(
      /Unauthorized or Not Found/,
    );

    // Verificar que el precio NO cambió en la DB
    const [p] = await testDb
      .select()
      .from(products)
      .where(eq(products.id, PROD_ID));
    expect(p?.price).toBe(1000);
  });

  it("RED: debe eliminar un producto de su propia organización", async () => {
    const repoA = new TenantRepository(ORG_A, testDb);
    await repoA.deleteProduct(PROD_ID);

    const [p] = await testDb
      .select()
      .from(products)
      .where(eq(products.id, PROD_ID));
    expect(p).toBeUndefined();
  });

  it("RED: NO debe permitir eliminar un producto de otra organización", async () => {
    const repoB = new TenantRepository(ORG_B, testDb);

    await expect(repoB.deleteProduct(PROD_ID)).rejects.toThrow(
      /Unauthorized or Not Found/,
    );

    const [p] = await testDb
      .select()
      .from(products)
      .where(eq(products.id, PROD_ID));
    expect(p).toBeDefined();
  });
});
