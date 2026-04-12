import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { AIClient } from "../lib/ai";
import { requireOrgAuth } from "../middleware/auth";
import type { HonoEnv } from "../index";

export const aiRoutes = new Hono<HonoEnv>();

// Todas las rutas de IA requieren autenticación de organización
aiRoutes.use("*", requireOrgAuth);

/**
 * POST /api/admin/digitize
 * Sube una foto de un menú físico y la digitaliza usando Gemini.
 */
aiRoutes.post("/digitize", async (c) => {
  const formData = await c.req.formData();
  const image = formData.get("image") as File;

  if (!image) {
    return c.json(
      {
        error: {
          code: "BAD_REQUEST",
          message: "No se ha subido ninguna imagen",
        },
      },
      400,
    );
  }

  const geminiKey = process.env["GEMINI_API_KEY"];
  const deeplKey = process.env["DEEPL_API_KEY"];

  if (!geminiKey || !deeplKey) {
    return c.json(
      {
        error: {
          code: "CONFIG_ERROR",
          message: "Servicios de IA no configurados",
        },
      },
      500,
    );
  }

  try {
    const aiClient = new AIClient(geminiKey, deeplKey);
    const buffer = await image.arrayBuffer();

    const items = await aiClient.digitizeMenu(buffer, image.type);

    return c.json({
      success: true,
      data: {
        items,
        allergens_confirmed: false, // Regla crítica: siempre falso tras digitalización
        message:
          "Digitalización completada. Por favor, revisa los nombres y precios.",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error de IA";
    return c.json(
      {
        error: {
          code: "AI_ERROR",
          message: message || "Error al procesar la imagen con Gemini",
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

aiRoutes.post("/translate", zValidator("json", translateSchema), async (c) => {
  const { text, sourceLang } = c.req.valid("json");

  const geminiKey = process.env["GEMINI_API_KEY"];
  const deeplKey = process.env["DEEPL_API_KEY"];

  if (!geminiKey || !deeplKey) {
    return c.json(
      {
        error: {
          code: "CONFIG_ERROR",
          message: "Servicios de IA no configurados",
        },
      },
      500,
    );
  }

  try {
    const aiClient = new AIClient(geminiKey, deeplKey);
    const translated = await aiClient.translateText(text, sourceLang);

    return c.json({ success: true, data: translated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error de traducción";
    return c.json(
      {
        error: {
          code: "AI_ERROR",
          message: message || "Error al traducir con DeepL",
        },
      },
      500,
    );
  }
});
