/**
 * © 2026 Rexeat - Todos los derechos reservados.
 * Tests de cumplimiento legal (EU 1169/2011).
 */
import { describe, it, expect, beforeEach } from "vitest";
import { sql } from "drizzle-orm";
import {
  createDb,
  TenantRepository,
  organizations,
  products,
  type AppDatabase,
} from "./index";
import { type OrganizationId, type AllergenMap } from "@rexeat/types";

describe("TenantRepository - Cumplimiento Legal (EU 1169/2011)", () => {
  let testDb: AppDatabase;
  const MY_ORG = "org_compliance" as OrganizationId;
  const PROD_ID = "prod_unconfirmed";

  beforeEach(async () => {
    testDb = createDb(":memory:");

    // Crear tablas usando el esquema real (DRY)
    await testDb.run(sql`CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY, 
      business_name TEXT, 
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    )`);
    await testDb.run(sql`CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY, 
      organization_id TEXT NOT NULL REFERENCES organizations(id), 
      name TEXT NOT NULL, 
      description TEXT,
      price INTEGER DEFAULT 0,
      allergens TEXT NOT NULL, 
      allergens_confirmed INTEGER DEFAULT 0,
      status TEXT DEFAULT 'in_stock',
      image TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    )`);

    await testDb
      .insert(organizations)
      .values({ id: MY_ORG, businessName: "Test Compliance" });
    await testDb.insert(products).values({
      id: PROD_ID,
      organizationId: MY_ORG,
      name: { es: "Plato de Prueba" },
      allergens: {},
      allergensConfirmed: false,
    });
  });

  it("debería marcar un producto como confirmado tras la validación humana", async () => {
    const repo = new TenantRepository(MY_ORG, testDb);
    const allergens: AllergenMap = { gluten: true, milk: false };

    const result = await repo.confirmAllergens(PROD_ID, allergens);

    expect(result.allergensConfirmed).toBe(true);
    expect(result.allergens.gluten).toBe(true);
    expect(result.allergens.milk).toBe(false);
  });

  it("NO debería permitir confirmar un producto que no pertenece a la organización", async () => {
    const maliciousRepo = new TenantRepository(
      "other_org" as OrganizationId,
      testDb,
    );

    await expect(maliciousRepo.confirmAllergens(PROD_ID, {})).rejects.toThrow(
      /Unauthorized or Not Found/,
    );
  });
});
