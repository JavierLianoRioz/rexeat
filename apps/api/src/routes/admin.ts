import { Hono, type Context } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { createTenantRepository } from "@rexeat/db";
import { requireOrgAuth } from "../middleware/auth";
import type { HonoEnv } from "../index";

import { type OrganizationId } from "@rexeat/types";

export const adminStock = new Hono<HonoEnv>();

adminStock.use("*", requireOrgAuth);

const getContextOrThrow = (c: Context<HonoEnv>) => {
  const orgId = c.get("orgId") as OrganizationId;
  const userId = c.get("userId") as string;
  if (!orgId || !userId) throw new Error("Missing context");
  return { orgId, userId };
};

const productSchema = z.object({
  name: z.record(z.string()),
  description: z.record(z.string()).optional(),
  price: z.number().int().nonnegative(),
  allergens: z.record(z.boolean()),
  status: z.enum(["in_stock", "out_of_stock"]),
  image: z.any().optional(),
});

const stockSchema = z.object({
  status: z.enum(["in_stock", "out_of_stock"]),
  reason: z.string().optional(),
});

adminStock.patch("/stock/:productId", zValidator("json", stockSchema), async (c) => {
  const productId = c.req.param("productId");
  const { status, reason } = c.req.valid("json" as never) as any;
  const { orgId, userId } = getContextOrThrow(c);
  
  await createTenantRepository(orgId).updateProductStatusWithLog({
    productId,
    userId,
    newStatus: status,
    reason,
  });

  return c.json({ success: true });
});

adminStock.post("/products", zValidator("json", productSchema), async (c) => {
  const data = c.req.valid("json" as never) as any;
  const { orgId } = getContextOrThrow(c);

  const product = await createTenantRepository(orgId).createProduct({
    ...data,
    id: crypto.randomUUID(),
  } as any);

  return c.json({ success: true, data: product }, 201);
});

adminStock.put("/products/:id", zValidator("json", productSchema), async (c) => {
  const productId = c.req.param("id");
  const data = c.req.valid("json" as never) as any;
  const { orgId } = getContextOrThrow(c);

  const product = await createTenantRepository(orgId).updateProduct(productId, {
    ...data,
    allergensConfirmed: true,
  } as any);

  return c.json({ success: true, data: product });
});

adminStock.delete("/products/:id", async (c) => {
  const productId = c.req.param("id");
  const { orgId } = getContextOrThrow(c);

  await createTenantRepository(orgId).deleteProduct(productId);
  return c.json({ success: true });
});
