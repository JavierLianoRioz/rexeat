/**
 * © 2026 Rexeat - Todos los derechos reservados.
 * Servicio de traducción optimizado con DeepL.
 */
import { type TranslatedString } from "@rexeat/types";

export type TargetLanguage = Exclude<keyof TranslatedString, "es">;

interface DeepLTranslationResponse {
  translations: Array<{
    detected_source_language: string;
    text: string;
  }>;
}

export class TranslationService {
  private readonly apiUrl = "https://api-free.deepl.com/v2/translate";

  constructor(private readonly apiKey: string) {}

  /**
   * Traduce una lista de textos a todos los idiomas soportados por Rexeat.
   * Optimiza el uso de la API enviando lotes de textos por idioma.
   */
  async translateBatch(texts: string[]): Promise<TranslatedString[]> {
    if (texts.length === 0) return [];

    const targetLangs: TargetLanguage[] = ["en", "fr", "de", "nl", "it"];

    // Inicializar resultados con el texto original en español
    const results: TranslatedString[] = texts.map((text) => ({
      es: text,
      en: "",
      fr: "",
      de: "",
      nl: "",
      it: "",
    }));

    // Ejecutar traducciones por idioma en paralelo
    await Promise.all(
      targetLangs.map(async (lang) => {
        try {
          const translatedTexts = await this.callDeepL(texts, lang);
          translatedTexts.forEach((translation, index) => {
            results[index]![lang] = translation;
          });
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error(`Error traduciendo a ${lang}:`, error);
          // Mantenemos strings vacíos en caso de error para no romper la UI
        }
      }),
    );

    return results;
  }

  private async callDeepL(
    texts: string[],
    targetLang: TargetLanguage,
  ): Promise<string[]> {
    const params = new URLSearchParams();
    texts.forEach((text) => params.append("text", text));
    params.append(
      "target_lang",
      targetLang === "en" ? "EN-US" : targetLang.toUpperCase(),
    );
    params.append("source_lang", "ES");

    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${this.apiKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`DeepL API Error (${response.status}): ${errorData}`);
    }

    const data = (await response.json()) as DeepLTranslationResponse;
    return data.translations.map((t) => t.text);
  }
}
