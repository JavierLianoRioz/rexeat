import { Hono, type Context } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { getAIClient } from "../lib/ai";
import { TranslationService } from "../lib/translation";
import { requireOrgAuth } from "../middleware/auth";
import type { HonoEnv } from "../index";

export const aiRoutes = new Hono<HonoEnv>();

aiRoutes.use("*", requireOrgAuth);

/**
 * POST /api/admin/digitize
 * Sube una foto de un menú físico y la digitaliza usando Gemini.
 * Traduce automáticamente los nombres a todos los idiomas de Rexeat.
 */
aiRoutes.post("/digitize", async (c: Context<HonoEnv>) => {
  const formData = await c.req.formData();
  const image = formData.get("image") as File | null;

  if (!image) {
    return c.json(
      { error: { code: "BAD_REQUEST", message: "No se ha subido imagen" } },
      400,
    );
  }

  try {
    const aiClient = getAIClient();
    const orgId = c.get("orgId");
    const buffer = await image.arrayBuffer();

    // Ahora digitizeMenu ya incluye la traducción automática optimizada
    const items = await aiClient.digitizeMenu(buffer, image.type, orgId);

    return c.json({
      success: true,
      data: {
        items,
        allergens_confirmed: false,
        message: "Digitalización y traducción completadas.",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error de IA";
    return c.json({ error: { code: "AI_ERROR", message } }, 500);
  }
});

/**
 * POST /api/admin/translate
 * Traduce un texto (o varios) a todos los idiomas de Rexeat usando DeepL optimizado.
 */
const translateSchema = z.object({
  texts: z.array(z.string().min(1)).or(z.string().min(1)),
});

aiRoutes.post("/translate", zValidator("json", translateSchema), async (c) => {
  const { texts } = c.req.valid("json" as never) as {
    texts: string[] | string;
  };

  try {
    const deeplKey = process.env["DEEPL_API_KEY"];
    if (!deeplKey) throw new Error("DeepL API Key no configurada");

    const translationService = new TranslationService(deeplKey);
    const inputTexts = Array.isArray(texts) ? texts : [texts];
    const results = await translationService.translateBatch(inputTexts);

    return c.json({
      success: true,
      data: Array.isArray(texts) ? results : results[0],
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error de traducción";
    return c.json({ error: { code: "AI_ERROR", message } }, 500);
  }
});
