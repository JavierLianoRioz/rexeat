import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq, type InferSelectModel, type InferInsertModel } from "drizzle-orm";
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

export interface ITenantRepository {
  getProducts(): Promise<Product[]>;
  createProduct(data: NewProduct): Promise<Product>;
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
