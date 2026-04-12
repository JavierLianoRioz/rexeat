
import {
  drizzle,
  type BetterSQLite3Database,
} from "drizzle-orm/better-sqlite3";
import {
  eq,
  and,
  type InferSelectModel,
  type InferInsertModel,
} from "drizzle-orm";
import Database from "better-sqlite3";
import { type AllergenMap } from "@rexeat/types";
import * as schema from "./schema";

export const createDb = (path = "local.db") => {
  const sqlite = new Database(path);
  return drizzle(sqlite, { schema });
};

export const db = createDb();

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
    private readonly database: BetterSQLite3Database<typeof schema> = db,
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
    // Better-sqlite3 requiere transacciones síncronas
    db.transaction((tx) => {
      // 1. Obtener producto actual para validar pertenencia y estado previo
      const product = tx
        .select()
        .from(schema.products)
        .where(
          and(
            eq(schema.products.id, productId),
            eq(schema.products.organizationId, this.organizationId),
          ),
        )
        .get(); // Uso .get() para ejecución síncrona de una única fila

      if (!product) {
        throw new Error(`Product ${productId} not found in this organization`);
      }

      // 2. Actualizar estado del producto
      tx.update(schema.products)
        .set({
          status: newStatus,
          updatedAt: new Date(),
        })
        .where(eq(schema.products.id, productId))
        .run(); // Uso .run() para ejecución síncrona

      // 3. Crear registro de auditoría
      tx.insert(schema.productStockLogs)
        .values({
          id: crypto.randomUUID(),
          productId,
          organizationId: this.organizationId,
          userId,
          oldStatus: product.status,
          newStatus,
          reason,
        })
        .run();
    });
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
  database?: BetterSQLite3Database<typeof schema>,
): ITenantRepository => new TenantRepository(id, database);

export * from "./schema";
export * from "drizzle-orm";
