import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import {
  eq,
  and,
  type InferSelectModel,
  type InferInsertModel,
} from "drizzle-orm";
import { type AllergenMap } from "@rexeat/types";
import * as schema from "./schema";

// Función para inicializar la conexión según el entorno
export const createDb = () => {
  const url = process.env["DATABASE_URL"];
  const authToken = process.env["DATABASE_AUTH_TOKEN"];

  if (url) {
    const client = createClient({ url, authToken: authToken ?? "" });
    return drizzle(client, { schema });
  }

  // Fallback para desarrollo local si no hay URL de Turso
  try {
    const BetterSQLite3 = require("better-sqlite3");
    const sqlite = new BetterSQLite3("local.db");
    const { drizzle: drizzleSqlite } = require("drizzle-orm/better-sqlite3");
    return drizzleSqlite(sqlite, { schema });
  } catch (e) {
    throw new Error("No database connection available (Turso or local SQLite)");
  }
};

export const db = createDb();

// Re-exportamos tipos para uso global
export type DB = typeof db;
export type Product = InferSelectModel<typeof schema.products>;
export type NewProduct = Omit<
  InferInsertModel<typeof schema.products>,
  "organizationId"
>;
export type Category = InferSelectModel<typeof schema.categories>;
export type Local = InferSelectModel<typeof schema.locals>;
export type Organization = InferSelectModel<typeof schema.organizations>;
export type ProductStockLog = InferSelectModel<typeof schema.productStockLogs>;

export interface ITenantRepository {
  getProducts(): Promise<Product[]>;
  createProduct(data: NewProduct): Promise<Product>;
  updateProductStatusWithLog(params: {
    productId: string;
    userId: string;
    newStatus: schema.AvailabilityStatus;
    reason?: string;
  }): Promise<void>;
  confirmAllergens(productId: string, allergens: AllergenMap): Promise<Product>;
  getCategories(): Promise<Category[]>;
  getLocals(): Promise<Local[]>;
  getInfo(): Promise<Organization | null>;
}

export class TenantRepository implements ITenantRepository {
  constructor(
    private readonly organizationId: string,
    private readonly database: any = db,
  ) {}

  async getProducts(): Promise<Product[]> {
    return this.database
      .select()
      .from(schema.products)
      .where(eq(schema.products.organizationId, this.organizationId));
  }

  async createProduct(data: NewProduct): Promise<Product> {
    const results = await this.database
      .insert(schema.products)
      .values({
        ...data,
        organizationId: this.organizationId,
      } as InferInsertModel<typeof schema.products>)
      .returning();

    const createdProduct = results[0];

    if (!createdProduct) {
      throw new Error(
        `Failed to create product in organization: ${this.organizationId}`,
      );
    }

    return createdProduct;
  }

  async updateProductStatusWithLog({
    productId,
    userId,
    newStatus,
    reason,
  }: {
    productId: string;
    userId: string;
    newStatus: schema.AvailabilityStatus;
    reason?: string;
  }): Promise<void> {
    // Better-sqlite3 requiere transacciones síncronas, libSQL asíncronas.
    // Usamos el database inyectado.
    await this.database.transaction(async (tx: any) => {
      // 1. Obtener producto actual para validar pertenencia y estado previo
      const results = await tx
        .select()
        .from(schema.products)
        .where(
          and(
            eq(schema.products.id, productId),
            eq(schema.products.organizationId, this.organizationId),
          ),
        );
      
      const product = results[0];

      if (!product) {
        throw new Error(`Product ${productId} not found in this organization`);
      }

      // 2. Actualizar estado del producto
      await tx.update(schema.products)
        .set({
          status: newStatus,
          updatedAt: new Date(),
        })
        .where(eq(schema.products.id, productId));

      // 3. Crear registro de auditoría
      await tx.insert(schema.productStockLogs)
        .values({
          id: crypto.randomUUID(),
          productId,
          organizationId: this.organizationId,
          userId,
          oldStatus: product.status,
          newStatus,
          reason,
        });
    });
  }

  async confirmAllergens(
    productId: string,
    allergens: AllergenMap,
  ): Promise<Product> {
    const results = await this.database
      .update(schema.products)
      .set({
        allergens,
        allergensConfirmed: true,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.products.id, productId),
          eq(schema.products.organizationId, this.organizationId),
        ),
      )
      .returning();

    const updatedProduct = results[0];
    if (!updatedProduct) {
      throw new Error(`Product not found or unauthorized: ${productId}`);
    }

    return updatedProduct;
  }

  async getCategories(): Promise<Category[]> {
    return this.database
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.organizationId, this.organizationId));
  }

  async getLocals(): Promise<Local[]> {
    return this.database
      .select()
      .from(schema.locals)
      .where(eq(schema.locals.organizationId, this.organizationId));
  }

  async getInfo(): Promise<Organization | null> {
    const results = await this.database
      .select()
      .from(schema.organizations)
      .where(eq(schema.organizations.id, this.organizationId));

    return results[0] ?? null;
  }
}

export const createTenantRepository = (
  id: string,
  database?: any,
): ITenantRepository => new TenantRepository(id, database);


export * from "./schema";
export * from "drizzle-orm";
