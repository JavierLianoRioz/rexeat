import {
  drizzle as drizzleLibsql,
  type LibSQLDatabase,
} from "drizzle-orm/libsql";
import {
  drizzle as drizzleBetterSqlite,
  type BetterSQLite3Database,
} from "drizzle-orm/better-sqlite3";
import { createClient } from "@libsql/client";
import {
  eq,
  and,
  type InferSelectModel,
  type InferInsertModel,
} from "drizzle-orm";
import { type AllergenMap, type OrganizationId } from "@rexeat/types";
import * as schema from "./schema";

import BetterSQLite3 from "better-sqlite3";

export type AppDatabase =
  | LibSQLDatabase<typeof schema>
  | BetterSQLite3Database<typeof schema>;

export const createDb = (customUrl?: string): AppDatabase => {
  const url = customUrl ?? process.env["DATABASE_URL"];
  const authToken = process.env["DATABASE_AUTH_TOKEN"];

  if (url && url !== ":memory:") {
    const client = createClient({ url, authToken: authToken ?? "" });
    return drizzleLibsql(client, { schema });
  }

  try {
    const sqlite = new BetterSQLite3(url ?? "local.db");
    return drizzleBetterSqlite(sqlite, { schema });
  } catch (error) {
    throw new Error("Failed to initialize database connection.", {
      cause: error,
    });
  }
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
  updateProduct(
    productId: string,
    data: Partial<NewProduct> & { allergensConfirmed?: boolean },
  ): Promise<Product>;
  deleteProduct(productId: string): Promise<void>;
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
  getFullMenu(): Promise<unknown[]>;
}

export class TenantRepository implements ITenantRepository {
  constructor(
    private readonly organizationId: OrganizationId,
    private readonly database: AppDatabase = db,
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

    return this.validateResult(
      results[0],
      `create product in ${this.organizationId}`,
    );
  }

  async updateProduct(
    productId: string,
    data: Partial<NewProduct> & { allergensConfirmed?: boolean },
  ): Promise<Product> {
    const results = await this.database
      .update(schema.products)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.products.id, productId),
          eq(schema.products.organizationId, this.organizationId),
        ),
      )
      .returning();

    return this.validateResult(results[0], `update product ${productId}`);
  }

  async deleteProduct(productId: string): Promise<void> {
    const result = await this.database
      .delete(schema.products)
      .where(
        and(
          eq(schema.products.id, productId),
          eq(schema.products.organizationId, this.organizationId),
        ),
      )
      .returning();

    this.validateResult(result[0], `delete product ${productId}`);
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
    await this.database.transaction(async (tx) => {
      const product = await this.fetchProduct(tx as AppDatabase, productId);

      await tx
        .update(schema.products)
        .set({ status: newStatus, updatedAt: new Date() })
        .where(eq(schema.products.id, productId));

      await tx.insert(schema.productStockLogs).values({
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

    return this.validateResult(
      results[0],
      `confirm allergens for ${productId}`,
    );
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

  async getFullMenu(): Promise<unknown[]> {
    const db = this.database as LibSQLDatabase<typeof schema>;
    return db.query.categories.findMany({
      where: eq(schema.categories.organizationId, this.organizationId),
      orderBy: schema.categories.order,
      with: {
        productsToCategories: {
          with: {
            product: {
              where: eq(schema.products.organizationId, this.organizationId),
            },
          },
        },
      },
    });
  }

  private async fetchProduct(
    tx: AppDatabase,
    productId: string,
  ): Promise<Product> {
    const results = await tx
      .select()
      .from(schema.products)
      .where(
        and(
          eq(schema.products.id, productId),
          eq(schema.products.organizationId, this.organizationId),
        ),
      );

    return this.validateResult(results[0], `product ${productId} not found`);
  }

  private validateResult<T>(result: T | undefined, context: string): T {
    if (!result) {
      throw new Error(`Unauthorized or Not Found: ${context}`);
    }
    return result;
  }
}

export const createTenantRepository = (
  id: OrganizationId,
  database?: AppDatabase,
): ITenantRepository => new TenantRepository(id, database);

export * from "./schema";
export * from "drizzle-orm";
