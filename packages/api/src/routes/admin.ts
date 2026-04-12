import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { createTenantRepository } from "@rexeat/db";
import { AvailabilityStatusSchema } from "@rexeat/types";
import { requireOrgAuth } from "../middleware/auth";
import type { HonoEnv } from "../index";

export const adminStock = new Hono<HonoEnv>();

// Middleware de seguridad para todas las rutas de admin
adminStock.use("*", requireOrgAuth);

// Esquema de validación para el cambio de stock
const updateStockSchema = z.object({
  status: AvailabilityStatusSchema,
  reason: z.string().optional(),
});

/**
 * PATCH /api/admin/stock/:productId
 */
adminStock.patch(
  "/stock/:productId",
  zValidator("json", updateStockSchema),
  async (c) => {
    const productId = c.req.param("productId");
    const { status, reason } = c.req.valid("json");

    const orgId = c.var.orgId;
    const userId = c.var.userId;

    try {
      const repo = createTenantRepository(orgId);

      await repo.updateProductStatusWithLog({
        productId,
        userId,
        newStatus: status,
        reason,
      });

      return c.json({
        success: true,
        data: {
          productId,
          newStatus: status,
          updatedAt: new Date().toISOString(),
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      const isNotFound = message.includes("not found");

      return c.json(
        {
          error: {
            code: isNotFound ? "NOT_FOUND" : "UPDATE_FAILED",
            message: message || "Error al actualizar el stock",
          },
        },
        isNotFound ? 404 : 400,
      );
    }
  },
);

// Re-definimos para evitar problemas de compatibilidad de tipos complejos en el Edge
const createProductSchema = z.object({
  name: z.any(),
  description: z.any(),
  price: z.number().int().nonnegative(),
  allergens: z.any(),
  status: AvailabilityStatusSchema,
  image: z.any().optional(),
});

adminStock.post(
  "/products",
  zValidator("json", createProductSchema),
  async (c) => {
    const data = c.req.valid("json");
    const orgId = c.var.orgId;

    try {
      const repo = createTenantRepository(orgId);

      const newProduct = await repo.createProduct({
        ...data,
        id: crypto.randomUUID(),
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      return c.json({ success: true, data: newProduct }, 201);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      return c.json(
        {
          error: {
            code: "CREATE_FAILED",
            message: message || "No se pudo crear el producto",
          },
        },
        400,
      );
    }
  },
);

adminStock.put(
  "/products/:id",
  zValidator("json", createProductSchema),
  async (c) => {
    const productId = c.req.param("id");
    const newData = c.req.valid("json");
    const orgId = c.var.orgId;

    try {
      const repo = createTenantRepository(orgId);

      const updatedProduct = await repo.confirmAllergens(
        productId,
        (newData as any).allergens,
      ); // eslint-disable-line @typescript-eslint/no-explicit-any

      return c.json({ success: true, data: updatedProduct });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      return c.json(
        {
          error: {
            code: "UPDATE_FAILED",
            message: message || "No se pudo actualizar el producto",
          },
        },
        400,
      );
    }
  },
);
