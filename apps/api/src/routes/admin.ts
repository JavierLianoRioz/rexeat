/**
 * © 2026 Rexeat - Todos los derechos reservados.
 * Este archivo está protegido bajo la licencia Polyform Non-Commercial 1.0.0.
 */
import { Hono, type Context } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { createTenantRepository, type AvailabilityStatus } from "@rexeat/db";
import { requireOrgAuth } from "../middleware/auth";
import type { HonoEnv } from "../index";
import { pusher } from "../lib/pusher";
import { type OrganizationId } from "@rexeat/types";

export const adminStock = new Hono<HonoEnv>();

// Middleware de autenticación para todas las rutas de admin
adminStock.use("*", requireOrgAuth);

/**
 * Obtiene orgId y userId del contexto de Hono de forma segura.
 */
const getAuthContext = (c: Context<HonoEnv>) => {
  const orgId = c.get("orgId") as OrganizationId;
  const userId = c.get("userId");

  if (!orgId || !userId) {
    throw new Error("Missing authentication context");
  }

  return { orgId, userId };
};

const stockSchema = z.object({
  status: z.enum([
    "in_stock",
    "out_of_stock",
    "hidden",
    "temporarily_unavailable",
  ]),
  reason: z.string().optional(),
});

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
  image: z.any().optional(),
});

/**
 * PATCH /api/admin/stock/:productId
 * Actualiza el estado de stock de un producto con log de auditoría.
 */
adminStock.patch(
  "/stock/:productId",
  zValidator("json", stockSchema),
  async (c) => {
    const productId = c.req.param("productId");
    const { status, reason } = c.req.valid("json");
    const { orgId, userId } = getAuthContext(c);

    await createTenantRepository(orgId).updateProductStatusWithLog({
      productId,
      userId,
      newStatus: status as AvailabilityStatus,
      ...(reason ? { reason } : {}),
    });

    // Notificar cambio en tiempo real a los clientes (Pusher)
    await pusher.trigger(`public-org-${orgId}`, "STOCK_UPDATE", {
      productId,
      status,
      organizationId: orgId,
    });

    return c.json({ success: true });
  },
);

/**
 * POST /api/admin/products
 * Crea un nuevo producto para la organización.
 */
adminStock.post("/products", zValidator("json", productSchema), async (c) => {
  const data = c.req.valid("json");
  const { orgId } = getAuthContext(c);

  const product = await createTenantRepository(orgId).createProduct({
    ...data,
    id: crypto.randomUUID(),
  } as Parameters<
    ReturnType<typeof createTenantRepository>["createProduct"]
  >[0]);

  return c.json({ success: true, data: product }, 201);
});

/**
 * PUT /api/admin/products/:id
 * Actualiza un producto existente.
 */
adminStock.put(
  "/products/:id",
  zValidator("json", productSchema),
  async (c) => {
    const productId = c.req.param("id");
    const data = c.req.valid("json");
    const { orgId } = getAuthContext(c);

    const product = await createTenantRepository(orgId).updateProduct(
      productId,
      {
        ...data,
        allergensConfirmed: true,
      } as Parameters<
        ReturnType<typeof createTenantRepository>["updateProduct"]
      >[1],
    );

    return c.json({ success: true, data: product });
  },
);

/**
 * DELETE /api/admin/products/:id
 * Elimina un producto.
 */
adminStock.delete("/products/:id", async (c) => {
  const productId = c.req.param("id");
  const { orgId } = getAuthContext(c);

  await createTenantRepository(orgId).deleteProduct(productId);
  return c.json({ success: true });
});
