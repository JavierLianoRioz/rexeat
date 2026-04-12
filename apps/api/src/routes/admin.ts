import { Hono, type Context } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { createTenantRepository } from "@rexeat/db";
import { requireOrgAuth } from "../middleware/auth";
import type { HonoEnv } from "../index";

export const adminStock = new Hono<HonoEnv>();

// Middleware de seguridad para todas las rutas de admin
adminStock.use("*", requireOrgAuth);

const getContextOrThrow = (c: Context<HonoEnv>) => {
  const orgId = c.get("orgId") as string;
  const userId = c.get("userId") as string;
  if (!orgId || !userId) {
    throw new Error("Missing organization or user context");
  }
  return { orgId, userId };
};

// Esquema de validación para el cambio de stock
const updateStockSchema = z.object({
  status: z.any(),
  reason: z.string().optional(),
});

/**
 * PATCH /api/admin/stock/:productId
 */
adminStock.patch(
  "/stock/:productId",
  zValidator("json", updateStockSchema),
  async (c: Context<HonoEnv>) => {
    const productId = c.req.param("productId") as string;
    const { status, reason } = c.req.valid("json" as never) as any;

    try {
      const { orgId, userId } = getContextOrThrow(c);
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
        (isNotFound ? 404 : 400) as any,
      );
    }
  },
);

const createProductSchema = z.object({
  name: z.any(),
  description: z.any(),
  price: z.number().int().nonnegative(),
  allergens: z.any(),
  status: z.any(),
  image: z.any().optional(),
});

adminStock.post(
  "/products",
  zValidator("json", createProductSchema),
  async (c: Context<HonoEnv>) => {
    const data = c.req.valid("json" as never) as any;

    try {
      const { orgId } = getContextOrThrow(c);
      const repo = createTenantRepository(orgId);

      const newProduct = await repo.createProduct({
        ...data,
        id: crypto.randomUUID(),
      } as any);

      return c.json({ success: true, data: newProduct }, 201 as any);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      return c.json(
        {
          error: {
            code: "CREATE_FAILED",
            message: message || "No se pudo crear el producto",
          },
        },
        400 as any,
      );
    }
  },
);

adminStock.put(
  "/products/:id",
  zValidator("json", createProductSchema),
  async (c: Context<HonoEnv>) => {
    const productId = c.req.param("id") as string;
    const newData = c.req.valid("json" as never) as any;

    try {
      const { orgId } = getContextOrThrow(c);
      const repo = createTenantRepository(orgId);

      const updatedProduct = await repo.confirmAllergens(
        productId,
        newData.allergens,
      );

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
        400 as any,
      );
    }
  },
);
