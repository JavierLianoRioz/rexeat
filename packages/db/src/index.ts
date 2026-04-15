import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { eq, and } from "drizzle-orm";
import * as schema from "./schema";
import { type AllergenMap } from "@rexeat/types";

// Re-exportar esquema para conveniencia
export * from "./schema";

export type AppDatabase = ReturnType<typeof createDb>;

/**
 * Crea una instancia de la base de datos (Turso/LibSQL).
 */
export function createDb(url: string = "file:local.db", authToken?: string) {
  const client = createClient({ url, authToken });
  return drizzle(client, { schema });
}

// Singleton de base de datos por defecto (usando variables de entorno o local.db)
// En Vercel/Producción se usaría process.env.TURSO_DATABASE_URL
const url = process.env["TURSO_DATABASE_URL"] || "file:local.db";
const authToken = process.env["TURSO_AUTH_TOKEN"];

export const db = createDb(url, authToken);

/**
 * Repositorio especializado en operaciones multi-inquilino.
 * Todas las consultas están blindadas por organizationId.
 */
export class TenantRepository {
  constructor(
    private readonly organizationId: string,
    private readonly database: AppDatabase = db,
  ) {}

  /**
   * Obtiene la información de la propia organización.
   */
  async getInfo() {
    const [info] = await this.database
      .select()
      .from(schema.organizations)
      .where(eq(schema.organizations.id, this.organizationId));
    return info;
  }

  /**
   * Obtiene todos los productos de la organización.
   */
  async getProducts() {
    return this.database.query.products.findMany({
      where: eq(schema.products.organizationId, this.organizationId),
    });
  }

  /**
   * Obtiene un producto por ID, validando pertenencia.
   */
  async getProduct(id: string) {
    const [product] = await this.database
      .select()
      .from(schema.products)
      .where(
        and(
          eq(schema.products.id, id),
          eq(schema.products.organizationId, this.organizationId),
        ),
      );
    return product;
  }

  /**
   * Actualiza un producto validando pertenencia.
   */
  async updateProduct(
    id: string,
    data: Partial<typeof schema.products.$inferInsert>,
  ) {
    const result = await this.database
      .update(schema.products)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(
          eq(schema.products.id, id),
          eq(schema.products.organizationId, this.organizationId),
        ),
      )
      .returning();

    if (result.length === 0) {
      throw new Error(
        "Unauthorized or Not Found: Product does not belong to this organization.",
      );
    }

    return result[0]!;
  }

  /**
   * Elimina un producto validando pertenencia.
   */
  async deleteProduct(id: string) {
    const result = await this.database
      .delete(schema.products)
      .where(
        and(
          eq(schema.products.id, id),
          eq(schema.products.organizationId, this.organizationId),
        ),
      )
      .returning();

    if (result.length === 0) {
      throw new Error(
        "Unauthorized or Not Found: Product does not belong to this organization.",
      );
    }

    return result[0]!;
  }

  /**
   * Actualiza el precio de un producto.
   */
  async updateProductPrice(id: string, price: number) {
    return this.updateProduct(id, { price });
  }

  /**
   * Actualiza el estado de un producto registrando el cambio en el log de auditoría.
   */
  async updateProductStatusWithLog(params: {
    productId: string;
    userId: string;
    newStatus: typeof schema.products.$inferSelect.status;
    reason?: string;
  }) {
    return this.database.transaction(async (tx) => {
      // 1. Obtener estado actual y validar propiedad
      const [product] = await tx
        .select()
        .from(schema.products)
        .where(
          and(
            eq(schema.products.id, params.productId),
            eq(schema.products.organizationId, this.organizationId),
          ),
        );

      if (!product) {
        throw new Error(
          "Unauthorized or Not Found: Product does not belong to this organization.",
        );
      }

      // 2. Actualizar producto
      await tx
        .update(schema.products)
        .set({ status: params.newStatus, updatedAt: new Date() })
        .where(eq(schema.products.id, params.productId));

      // 3. Crear log
      const [log] = await tx
        .insert(schema.productStockLogs)
        .values({
          productId: params.productId,
          organizationId: this.organizationId,
          userId: params.userId,
          oldStatus: product.status,
          newStatus: params.newStatus,
          reason: params.reason,
        })
        .returning();

      return { product: { ...product, status: params.newStatus }, log };
    });
  }

  /**
   * Obtiene todas las categorías de la organización.
   */
  async getCategories() {
    return this.database.query.categories.findMany({
      where: eq(schema.categories.organizationId, this.organizationId),
      orderBy: (categories, { asc }) => [asc(categories.order)],
    });
  }

  /**
   * Crea un nuevo producto.
   */
  async createProduct(
    data: Omit<typeof schema.products.$inferInsert, "organizationId">,
  ) {
    const [product] = await this.database
      .insert(schema.products)
      .values({
        ...data,
        organizationId: this.organizationId,
      })
      .returning();
    return product!;
  }

  /**
   * Crea una nueva categoría.
   */
  async createCategory(
    data: Omit<typeof schema.categories.$inferInsert, "organizationId">,
  ) {
    const [category] = await this.database
      .insert(schema.categories)
      .values({
        ...data,
        organizationId: this.organizationId,
      })
      .returning();
    return category!;
  }

  /**
   * Confirma alérgenos de un producto (Ley UE 1169/2011).
   */
  async confirmAllergens(id: string, allergens: AllergenMap) {
    return this.updateProduct(id, {
      allergens,
      allergensConfirmed: true,
    });
  }

  /**
   * Obtiene el menú completo con categorías y productos, filtrando por inquilino.
   */
  async getFullMenu() {
    return this.database.query.categories
      .findMany({
        where: eq(schema.categories.organizationId, this.organizationId),
        orderBy: (categories, { asc }) => [asc(categories.order)],
        with: {
          productsToCategories: {
            with: {
              product: true,
            },
          },
        },
      })
      .then((categories) => {
        // Filtrar productos que podrían estar vinculados pero no pertenecen al inquilino (SEC-01)
        return categories.map((cat) => ({
          ...cat,
          productsToCategories: cat.productsToCategories.filter(
            (rel) =>
              rel.product && rel.product.organizationId === this.organizationId,
          ),
        }));
      });
  }
}

/**
 * Busca un local por su slug único.
 * Útil para resolver la organización a partir de una URL pública.
 */
export async function findLocalBySlug(
  slug: string,
  database: AppDatabase = db,
) {
  const [local] = await database
    .select()
    .from(schema.locals)
    .where(eq(schema.locals.slug, slug));
  return local;
}

/**
 * Factory para crear repositorios de inquilinos de forma sencilla.
 */
export function createTenantRepository(
  organizationId: string,
  database?: AppDatabase,
) {
  return new TenantRepository(organizationId, database);
}

export const version = "1.1.0";
