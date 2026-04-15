/**
 * © 2026 Rexeat - Todos los derechos reservados.
 * Este archivo está protegido bajo la licencia Polyform Non-Commercial 1.0.0.
 */
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import {
  version,
  type TenantRepository,
  findLocalBySlug,
  createTenantRepository,
} from "@rexeat/db";
import type { PublicMenuResponse, TranslatedString } from "@rexeat/types";

// Importación de rutas
import { adminStock } from "./routes/admin";

/**
 * Entorno de Hono compartido para toda la API.
 */
export interface HonoEnv {
  Variables: {
    orgId: string;
    userId: string;
    jwtPayload: Record<string, unknown>;
    repo: TenantRepository;
  };
}

/**
 * Rexeat API - High-performance Edge Backend
 */
const app = new Hono<HonoEnv>().basePath("/api");

// --- Middlewares ---
app.use("*", logger());
app.use("*", cors());

// --- Health Check ---
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    uptime: process.uptime(),
    db_version: version,
    runtime: "edge",
  });
});

// --- Admin Routes (Internal & Protected) ---

/**
 * Todas las rutas de administración requieren autenticación de organización
 * e inyección automática del repositorio aislado.
 */
app.route("/admin", adminStock);

// --- Public Routes (Customer Facing) ---

/**
 * Fetch the public menu for a specific restaurant (tenant) by slug.
 */
app.get("/menu/:slug", async (c) => {
  const slug = c.req.param("slug");

  // 1. Resolver el local por slug
  const local = await findLocalBySlug(slug);

  if (!local) {
    return c.json(
      {
        error: {
          code: "NOT_FOUND",
          message: "No se ha encontrado el restaurante solicitado",
        },
      },
      404,
    );
  }

  // 2. Obtener el menú completo usando el TenantRepository (Aislado)
  const repo = createTenantRepository(local.organizationId);
  const categories = await repo.getFullMenu();

  // 3. Mapear al formato PublicMenuResponse
  const response: PublicMenuResponse = {
    tenant: {
      name: (local.name as TranslatedString).es || "Restaurante", // Por ahora ES por defecto
      logo: local.logo?.url,
      primaryColor: "#E63946", // TODO: Sacar de la configuración del local si existe
      accentColor: "#F1FAEE",
    },
    menu: {
      id: "main",
      name: "Menú Principal",
      isActive: true,
      categories: categories.map((cat) => ({
        id: cat.id,
        menuId: "main",
        name: (cat.name as TranslatedString).es || "Sin Nombre",
        order: cat.order,
        items: cat.productsToCategories
          .map((rel) => rel.product)
          .filter(Boolean)
          .map((prod) => ({
            id: prod!.id,
            categoryId: cat.id,
            name: (prod!.name as TranslatedString).es || "Sin Nombre",
            price: prod!.price,
            allergens: Object.entries(prod!.allergens)
              .filter(([_, value]) => value === true)
              .map(([key]) => key),
            isAvailable: prod!.status === "in_stock",
            isVegetarian: false, // TODO: Añadir flags al esquema de productos si se requieren
            isVegan: false,
            isGlutenFree: !prod!.allergens.gluten,
          })),
      })),
    },
  };

  return c.json(response);
});

// --- Admin Routes (Internal) ---

app.get("/admin", (c) => {
  return c.json({
    message: "Admin endpoints protected by Clerk session (WIP)",
  });
});

// --- Finalize ---

export default app;
