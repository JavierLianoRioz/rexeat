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
  get(ts: TranslatedString, lang: Language = DEFAULT_LANGUAGE): string {
    return ts[lang] || ts.es;
  },
} as const;
