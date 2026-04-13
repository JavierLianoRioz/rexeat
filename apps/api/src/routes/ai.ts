import { Hono, type Context } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { getAIClient } from "../lib/ai";
import { requireOrgAuth } from "../middleware/auth";
import type { HonoEnv } from "../index";

export const aiRoutes = new Hono<HonoEnv>();

aiRoutes.use("*", requireOrgAuth);

/**
 * POST /api/admin/digitize
 * Sube una foto de un menú físico y la digitaliza usando Gemini.
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
    const buffer = await image.arrayBuffer();
    const items = await aiClient.digitizeMenu(buffer, image.type);

    return c.json({
      success: true,
      data: {
        items,
        allergens_confirmed: false,
        message: "Digitalización completada.",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error de IA";
    return c.json(
      {
        error: {
          code: "AI_ERROR",
          message,
        },
      },
      500,
    );
  }
});

/**
 * POST /api/admin/translate
 * Traduce un texto a todos los idiomas de Rexeat usando DeepL.
 */
const translateSchema = z.object({
  text: z.string().min(1),
  sourceLang: z.string().optional().default("es"),
});

aiRoutes.post(
  "/translate",
  zValidator("json", translateSchema),
  async (c: Context<HonoEnv>) => {
    const { text, sourceLang } = c.req.valid("json");

    try {
      const aiClient = getAIClient();
      const translated = await aiClient.translateText(text, sourceLang);
      return c.json({ success: true, data: translated });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Error de traducción";
      return c.json(
        {
          error: {
            code: "AI_ERROR",
            message,
          },
        },
        500,
      );
    }
  },
);
