import {
  sqliteTable,
  text,
  integer,
  primaryKey,
  index,
} from "drizzle-orm/sqlite-core";
import { sql, relations } from "drizzle-orm";
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
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  businessName: text("business_name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(
    sql`(strftime('%s', 'now'))`,
  ),
});

export const users = sqliteTable(
  "users",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id),
    role: text("role").$type<UserRole>().notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).default(
      sql`(strftime('%s', 'now'))`,
    ),
  },
  (t) => ({
    orgIdx: index("users_org_idx").on(t.organizationId),
  }),
);

// --- Estructura Física (NFC Entry Points) ---

export const locals = sqliteTable(
  "locals",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id),
    name: text("name", { mode: "json" }).$type<TranslatedString>().notNull(),
    slug: text("slug").notNull().unique(),
    logo: text("logo", { mode: "json" }).$type<ImageMetadata>(),
    createdAt: integer("created_at", { mode: "timestamp" }).default(
      sql`(strftime('%s', 'now'))`,
    ),
  },
  (t) => ({
    orgIdx: index("locals_org_idx").on(t.organizationId),
  }),
);

export const zones = sqliteTable(
  "zones",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    localId: text("local_id")
      .notNull()
      .references(() => locals.id),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id),
    name: text("name").notNull(),
    slug: text("slug").notNull(), // Identificador semántico (ej: 'barra', 'terraza')
  },
  (t) => ({
    orgIdx: index("zones_org_idx").on(t.organizationId),
    localIdx: index("zones_local_idx").on(t.localId),
    uniqueZone: uniqueIndex("zones_slug_local_unique").on(t.localId, t.slug),
  }),
);

// --- Menú y Productos ---

export const products = sqliteTable(
  "products",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id),
    name: text("name", { mode: "json" }).$type<TranslatedString>().notNull(),
    description: text("description", {
      mode: "json",
    }).$type<TranslatedString>(),
    price: integer("price").notNull(),
    allergens: text("allergens", { mode: "json" })
      .$type<AllergenMap>()
      .notNull(),
    allergensConfirmed: integer("allergens_confirmed", { mode: "boolean" })
      .notNull()
      .default(false),
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
  },
  (t) => ({
    orgIdx: index("products_org_idx").on(t.organizationId),
  }),
);

export const categories = sqliteTable(
  "categories",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id),
    name: text("name", { mode: "json" }).$type<TranslatedString>().notNull(),
    order: integer("order").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" }).default(
      sql`(strftime('%s', 'now'))`,
    ),
  },
  (t) => ({
    orgIdx: index("categories_org_idx").on(t.organizationId),
  }),
);

export const productsToCategories = sqliteTable(
  "products_to_categories",
  {
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.productId, t.categoryId, t.organizationId] }),
    orgIdx: index("p2c_org_idx").on(t.organizationId),
    prodIdx: index("p2c_prod_idx").on(t.productId),
    catIdx: index("p2c_cat_idx").on(t.categoryId),
  }),
);

// --- Auditoría y Stock ---

export const languageRequests = sqliteTable(
  "language_requests",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id),
    localId: text("local_id")
      .notNull()
      .references(() => locals.id),
    langCode: text("lang_code").notNull(), // El código original (ej: 'es-MX', 'ru')
    resolvedLang: text("resolved_lang").notNull(), // El idioma que finalmente se mostró (ej: 'es', 'en')
    createdAt: integer("created_at", { mode: "timestamp" }).default(
      sql`(strftime('%s', 'now'))`,
    ),
  },
  (t) => ({
    orgIdx: index("lang_req_org_idx").on(t.organizationId),
    localIdx: index("lang_req_local_idx").on(t.localId),
  }),
);

export const productStockLogs = sqliteTable(
  "product_stock_logs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
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
  },
  (t) => ({
    orgIdx: index("stock_logs_org_idx").on(t.organizationId),
    prodIdx: index("stock_logs_prod_idx").on(t.productId),
  }),
);

// --- Relaciones ---

export const categoriesRelations = relations(categories, ({ many }) => ({
  productsToCategories: many(productsToCategories),
}));

export const productsRelations = relations(products, ({ many }) => ({
  productsToCategories: many(productsToCategories),
}));

export const productsToCategoriesRelations = relations(
  productsToCategories,
  ({ one }) => ({
    category: one(categories, {
      fields: [productsToCategories.categoryId],
      references: [categories.id],
    }),
    product: one(products, {
      fields: [productsToCategories.productId],
      references: [products.id],
    }),
  }),
);
