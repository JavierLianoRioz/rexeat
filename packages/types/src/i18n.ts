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
   * Resuelve el idioma final basado en reglas de negocio:
   * - Castellano/Latino (es-*) -> 'es'
   * - Otros no soportados -> 'en' -> 'es'
   */
  resolve(requested: string): Language {
    const lang = requested.toLowerCase().split("-")[0];

    // 1. Idiomas Latinos / Castellanos
    if (lang === "es") return "es";

    // 2. Idiomas soportados directamente
    const supported: Language[] = ["fr", "en", "de", "nl", "it"];
    if (supported.includes(lang as Language)) return lang as Language;

    // 3. Fallback no-castellano: Inglés -> Español
    return "en";
  },

  /**
   * Obtiene la traducción siguiendo la jerarquía:
   * 1. Idioma solicitado (ej: fr)
   * 2. Inglés (en) - Fallback universal para extranjeros
   * 3. Español (es) - Base mandatoria
   */
  get(
    ts: TranslatedString | undefined | null,
    lang: Language = DEFAULT_LANGUAGE,
  ): string {
    if (!ts) return "No translation";

    // 1. Intentar el idioma solicitado
    const requested = ts[lang];
    if (requested && requested.trim().length > 0) return requested;

    // 2. Si no es inglés, intentar inglés como fallback intermedio
    if (lang !== "en") {
      const en = ts.en;
      if (en && en.trim().length > 0) return en;
    }

    // 3. Fallback final garantizado: Español
    return ts.es || "No translation";
  },
} as const;
