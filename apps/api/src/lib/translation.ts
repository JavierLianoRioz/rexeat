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

export interface TranslationResult {
  translations: TranslatedString[];
  usage: {
    characters: number;
    costEstimate: number; // En milicéntimos
    service: "deepl";
  };
}

/**
 * Interfaz para servicios de traducción.
 */
export interface ITranslationService {
  translateBatch(texts: string[]): Promise<TranslationResult>;
}

export class TranslationService implements ITranslationService {
  private readonly apiUrl = "https://api-free.deepl.com/v2/translate";
  private readonly PRICE_PER_CHARACTER_MILLICENTS = 0.02; // 20€ / 1M chars = 0.00002€ = 0.02 milicéntimos

  constructor(private readonly apiKey: string) {}

  async translateBatch(texts: string[]): Promise<TranslationResult> {
    if (texts.length === 0) {
      return {
        translations: [],
        usage: { characters: 0, costEstimate: 0, service: "deepl" },
      };
    }

    const targetLangs: TargetLanguage[] = ["en", "fr", "de", "nl", "it"];
    let totalChars = 0;

    const results: TranslatedString[] = texts.map((text) => {
      totalChars += text.length * targetLangs.length;
      return { es: text, en: "", fr: "", de: "", nl: "", it: "" };
    });

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
        }
      }),
    );

    return {
      translations: results,
      usage: {
        characters: totalChars,
        costEstimate: Math.ceil(
          totalChars * this.PRICE_PER_CHARACTER_MILLICENTS,
        ),
        service: "deepl",
      },
    };
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
