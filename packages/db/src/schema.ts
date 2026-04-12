import {
  sqliteTable,
  text,
  integer,
  primaryKey,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import {
  type TranslatedString,
  type AllergenMap,
  type AvailabilityStatus,
  type UserRole,
  type ImageMetadata,
} from "@rexeat/types";

// Re-exportar para que estén disponibles en el namespace schema
export type {
  TranslatedString,
  AllergenMap,
  AvailabilityStatus,
  UserRole,
  ImageMetadata,
};

// --- Seguridad y Multi-inquilino ---

export const organizations = sqliteTable("organizations", {
  id: text("id").primaryKey(),
  businessName: text("business_name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(
    sql`(strftime('%s', 'now'))`,
  ),
});

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id),
  role: text("role").$type<UserRole>().notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(
    sql`(strftime('%s', 'now'))`,
  ),
});

// --- Estructura Física (NFC Entry Points) ---

export const locals = sqliteTable("locals", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id),
  name: text("name", { mode: "json" }).$type<TranslatedString>().notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo", { mode: "json" }).$type<ImageMetadata>(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(
    sql`(strftime('%s', 'now'))`,
  ),
});

export const zones = sqliteTable("zones", {
  id: text("id").primaryKey(),
  localId: text("local_id")
    .notNull()
    .references(() => locals.id),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id),
  name: text("name").notNull(),
  nfcToken: text("nfc_token").notNull().unique(), // Acceso directo por tarjeta de zona
});

// --- Menú y Productos ---

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id),
  name: text("name", { mode: "json" }).$type<TranslatedString>().notNull(),
  description: text("description", { mode: "json" }).$type<TranslatedString>(),
  price: integer("price").notNull(),
  allergens: text("allergens", { mode: "json" }).$type<AllergenMap>().notNull(),
  status: text("status")
    .$type<AvailabilityStatus>()
    .notNull()
    .default("in_stock"),
  image: text("image", { mode: "json" }).$type<ImageMetadata>(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(
    sql`(strftime('%s', 'now'))`,
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(
    sql`(strftime('%s', 'now'))`,
  ),
});

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id),
  name: text("name", { mode: "json" }).$type<TranslatedString>().notNull(),
  order: integer("order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).default(
    sql`(strftime('%s', 'now'))`,
  ),
});

export const productsToCategories = sqliteTable(
  "products_to_categories",
  {
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.productId, t.categoryId] }),
  }),
);

// --- Auditoría y Stock ---

export const productStockLogs = sqliteTable("product_stock_logs", {
  id: text("id").primaryKey(),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  oldStatus: text("old_status").$type<AvailabilityStatus>().notNull(),
  newStatus: text("new_status").$type<AvailabilityStatus>().notNull(),
  reason: text("reason"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(
    sql`(strftime('%s', 'now'))`,
  ),
});
