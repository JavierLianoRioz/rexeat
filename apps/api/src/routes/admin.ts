import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { type AvailabilityStatus } from "@rexeat/db";
import { requireOrgAuth } from "../middleware/auth";
import { withTenantRepo } from "../middleware/db";
import type { HonoEnv } from "../index";
import { pusher } from "../lib/pusher";

/**
 * Rutas de administración para la gestión de productos y stock.
 * Todas las rutas aquí están blindadas por organización (Multi-tenant).
 */
export const adminStock = new Hono<HonoEnv>();

// Aplicamos la cadena de seguridad: Autenticación -> Inyección de Repo
adminStock.use("*", requireOrgAuth);
adminStock.use("*", withTenantRepo);

/**
 * Esquema de validación para cambios de estado de stock.
 */
const stockSchema = z.object({
  status: z.enum([
    "in_stock",
    "out_of_stock",
    "hidden",
    "temporarily_unavailable",
  ]),
  reason: z.string().optional(),
});

/**
 * Esquema de validación para creación/actualización de productos.
 */
const productSchema = z.object({
  name: z.record(z.string()),
  description: z.record(z.string()).optional(),
  price: z.number().int().nonnegative(),
  allergens: z.record(z.boolean()),
  status: z.enum([
    "in_stock",
    "out_of_stock",
    "hidden",
    "temporarily_unavailable",
  ]),
});

/**
 * PATCH /admin/stock/:productId
 * Actualiza el estado de disponibilidad de un producto.
 */
adminStock.patch(
  "/stock/:productId",
  zValidator("json", stockSchema),
  async (c) => {
    const productId = c.req.param("productId");
    const { status, reason } = c.req.valid("json");
    const repo = c.get("repo");
    const userId = c.get("userId");
    const orgId = c.get("orgId");

    const { product } = await repo.updateProductStatusWithLog({
      productId,
      userId,
      newStatus: status as AvailabilityStatus,
      reason,
    });

    // Notificación en tiempo real via Pusher
    await pusher.trigger(`public-org-${orgId}`, "STOCK_UPDATE", {
      productId,
      status: product.status,
      organizationId: orgId,
    });

    return c.json({ success: true, status: product.status });
  },
);

/**
 * POST /admin/products
 * Crea un nuevo producto en la organización actual.
 */
adminStock.post("/products", zValidator("json", productSchema), async (c) => {
  const data = c.req.valid("json");
  const repo = c.get("repo");

  const product = await repo.createProduct({
    name: data.name,
    description: data.description,
    price: data.price,
    allergens: data.allergens,
    status: data.status,
    id: crypto.randomUUID(),
    allergensConfirmed: false,
  });

  return c.json({ success: true, data: product }, 201);
});

/**
 * PUT /admin/products/:id
 * Actualiza un producto existente.
 */
adminStock.put(
  "/products/:id",
  zValidator("json", productSchema),
  async (c) => {
    const productId = c.req.param("id");
    const data = c.req.valid("json");
    const repo = c.get("repo");

    const product = await repo.updateProduct(productId, {
      name: data.name,
      description: data.description,
      price: data.price,
      allergens: data.allergens,
      status: data.status,
      allergensConfirmed: true,
    });

    return c.json({ success: true, data: product });
  },
);

/**
 * DELETE /admin/products/:id
 * Elimina un producto.
 */
adminStock.delete("/products/:id", async (c) => {
  const productId = c.req.param("id");
  const repo = c.get("repo");

  await repo.deleteProduct(productId);
  return c.json({ success: true });
});
