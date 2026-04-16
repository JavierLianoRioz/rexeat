/**
 * © 2026 Rexeat - Todos los derechos reservados.
 */
import { Hono, type Context } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { getAIClient } from "../lib/ai";
import { TranslationService } from "../lib/translation";
import { requireOrgAuth } from "../middleware/auth";
import { db, apiUsageLogs } from "@rexeat/db";
import type { HonoEnv } from "../index";

export const aiRoutes = new Hono<HonoEnv>();

aiRoutes.use("*", requireOrgAuth);

const translateSchema = z.object({
  texts: z.array(z.string().min(1)).or(z.string().min(1)),
});

/**
 * POST /api/admin/ai/digitize
 */
aiRoutes.post("/digitize", async (c: Context<HonoEnv>) => {
  const formData = await c.req.formData();
  const image = formData.get("image") as File | null;

  if (!image) {
    return c.json(
      { error: { code: "BAD_REQUEST", message: "No image provided" } },
      400,
    );
  }

  try {
    const aiClient = getAIClient();
    const orgId = c.get("orgId");
    const buffer = await image.arrayBuffer();

    const result = await aiClient.digitizeMenu(buffer, image.type, orgId);

    // Auditoría de consumo: IA (OpenRouter)
    c.executionCtx.waitUntil(
      db.insert(apiUsageLogs).values({
        organizationId: orgId,
        service: "openrouter",
        model: result.usage.model,
        inputAmount: result.usage.promptTokens,
        outputAmount: result.usage.completionTokens,
        costEstimate: result.usage.aiCostMillicents,
      }),
    );

    // Auditoría de consumo: Traducción (DeepL)
    c.executionCtx.waitUntil(
      db.insert(apiUsageLogs).values({
        organizationId: orgId,
        service: "deepl",
        model: "deepl-v2",
        inputAmount: 0, // No aplica tokens, usamos caracteres
        costEstimate: result.usage.translationCostMillicents,
      }),
    );

    return c.json({
      success: true,
      data: {
        items: result.items,
        total_cost_millicents:
          result.usage.aiCostMillicents +
          result.usage.translationCostMillicents,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "AI Error";
    return c.json({ error: { code: "AI_ERROR", message } }, 500);
  }
});

/**
 * POST /api/admin/ai/translate
 */
aiRoutes.post("/translate", zValidator("json", translateSchema), async (c) => {
  const { texts } = c.req.valid("json" as never) as {
    texts: string[] | string;
  };
  const orgId = c.get("orgId");

  try {
    const deeplKey = process.env["DEEPL_API_KEY"];
    if (!deeplKey) throw new Error("DeepL API Key missing");

    const translationService = new TranslationService(deeplKey);
    const inputTexts = Array.isArray(texts) ? texts : [texts];
    const result = await translationService.translateBatch(inputTexts);

    // Auditoría de consumo (DeepL)
    c.executionCtx.waitUntil(
      db.insert(apiUsageLogs).values({
        organizationId: orgId,
        service: "deepl",
        model: "deepl-v2",
        inputAmount: result.usage.characters,
        costEstimate: result.usage.costEstimate,
      }),
    );

    return c.json({
      success: true,
      data: {
        translations: Array.isArray(texts)
          ? result.translations
          : result.translations[0],
        cost_millicents: result.usage.costEstimate,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Translation Error";
    return c.json({ error: { code: "AI_ERROR", message } }, 500);
  }
});
