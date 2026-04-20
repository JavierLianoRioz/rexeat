/**
 * © 2026 Rexeat - Todos los derechos reservados.
 */
import { Hono, type Context } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { AIService } from "../lib/services/AIService";
import { requireOrgAuth } from "../middleware/auth";
import { withTenantRepo } from "../middleware/db";
import { isolationGuard } from "../middleware/isolation";
import type { HonoEnv } from "../index";

/**
 * Rutas de IA (Boundary Layer)
 * Responsabilidad: Parsing de entrada, Gestión de errores HTTP y respuesta JSON.
 */
export const aiRoutes = new Hono<HonoEnv>();

// Cadena de seguridad robusta
aiRoutes.use("*", requireOrgAuth);
aiRoutes.use("*", withTenantRepo);
aiRoutes.use("*", isolationGuard);

const translateSchema = z.object({
  texts: z.array(z.string().min(1)).or(z.string().min(1)),
});

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * POST /api/admin/ai/digitize
 */
aiRoutes.post("/digitize", async (c: Context<HonoEnv>) => {
  const formData = await c.req.formData();
  const image = formData.get("image");

  // 1. Validar existencia y tipo de objeto
  if (!image || !(image instanceof File)) {
    return c.json(
      {
        error: { code: "BAD_REQUEST", message: "No valid image file provided" },
      },
      400,
    );
  }

  // 2. Validar tamaño (Prevención de DoS)
  if (image.size > MAX_FILE_SIZE) {
    return c.json(
      {
        error: {
          code: "PAYLOAD_TOO_LARGE",
          message: "Image size exceeds 5MB limit",
        },
      },
      413,
    );
  }

  // 3. Validar tipo MIME
  if (!ALLOWED_MIME_TYPES.includes(image.type)) {
    return c.json(
      {
        error: {
          code: "UNSUPPORTED_MEDIA_TYPE",
          message: "Only JPEG, PNG and WEBP are supported",
        },
      },
      415,
    );
  }

  try {
    const orgId = c.get("orgId");
    const repo = c.get("repo");
    const aiService = new AIService(orgId, repo);

    const buffer = await image.arrayBuffer();
    const result = await aiService.digitizeMenu(buffer, image.type);

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
    console.error(`[AI_DIGITIZE_ERROR] Org: ${c.get("orgId")}`, err);
    const message = err instanceof Error ? err.message : "Internal AI Error";
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
  const repo = c.get("repo");

  try {
    const aiService = new AIService(orgId, repo);
    const inputTexts = Array.isArray(texts) ? texts : [texts];
    const result = await aiService.translateBatch(inputTexts);

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
