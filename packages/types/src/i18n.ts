/**
 * © 2026 Rexeat - Todos los derechos reservados.
 * Este archivo está protegido bajo la licencia Polyform Non-Commercial 1.0.0.
 */
import { z } from "zod";

export const DEFAULT_LANGUAGE = "es" as const;

export const LanguageSchema = z.enum(["es", "fr", "en", "de", "nl", "it"]);
export type Language = z.infer<typeof LanguageSchema>;

export const TranslatedStringSchema = z.object({
  es: z.string().min(1),
  en: z.string().optional(),
  fr: z.string().optional(),
  de: z.string().optional(),
  nl: z.string().optional(),
  it: z.string().optional(),
});

export type TranslatedString = z.infer<typeof TranslatedStringSchema>;

export const i18n = {
  /**
   * Obtiene la traducción más adecuada siguiendo una cadena de fallback inteligente:
   * 1. Idioma solicitado
   * 2. Inglés (en) - Como lengua franca
   * 3. Español (es) - Como base mandatoria
   * 4. Primer idioma que tenga contenido
   * 5. Fallback final ("No translation")
   */
  get(
    ts: TranslatedString | undefined | null,
    lang: Language = DEFAULT_LANGUAGE,
  ): string {
    if (!ts) return "No translation";

    // 1. Idioma solicitado
    const requested = ts[lang];
    if (requested && requested.trim().length > 0) return requested;

    // 2. Inglés como lengua franca
    const en = ts.en;
    if (lang !== "en" && en && en.trim().length > 0) return en;

    // 3. Español como base
    const es = ts.es;
    if (lang !== "es" && es && es.trim().length > 0) return es;

    // 4. Cualquier otro idioma disponible
    for (const key of Object.keys(ts) as (keyof TranslatedString)[]) {
      const val = ts[key];
      if (val && val.trim().length > 0) return val;
    }

    return "No translation";
  },
} as const;
