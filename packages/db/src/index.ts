import { drizzle } from "drizzle-orm/better-sqlite3";
import {
  eq,
  and,
  type InferSelectModel,
  type InferInsertModel,
} from "drizzle-orm";
import Database from "better-sqlite3";
import * as schema from "./schema";

const sqlite = new Database("local.db");
export const db = drizzle(sqlite, { schema });

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
  getCategories(): Promise<Category[]>;
  getLocals(): Promise<Local[]>;
  getInfo(): Promise<Organization | null>;
}

export class TenantRepository implements ITenantRepository {
  constructor(private readonly organizationId: string) {}

  async getProducts(): Promise<Product[]> {
    return db
      .select()
      .from(schema.products)
      .where(eq(schema.products.organizationId, this.organizationId));
  }

  async createProduct(data: NewProduct): Promise<Product> {
    const results = await db
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
  }

  async getCategories(): Promise<Category[]> {
    return db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.organizationId, this.organizationId));
  }

  async getLocals(): Promise<Local[]> {
    return db
      .select()
      .from(schema.locals)
      .where(eq(schema.locals.organizationId, this.organizationId));
  }

  async getInfo(): Promise<Organization | null> {
    const results = await db
      .select()
      .from(schema.organizations)
      .where(eq(schema.organizations.id, this.organizationId));

    return results[0] ?? null;
  }
}

export const createTenantRepository = (id: string): ITenantRepository =>
  new TenantRepository(id);

export * from "./schema";
export * from "drizzle-orm";
