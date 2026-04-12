import {
  GoogleGenerativeAI,
  type GenerativeModel,
} from "@google/generative-ai";
import {
  type TranslatedString,
  type DigitizationItem,
  DigitizationResponseSchema,
} from "@rexeat/types";

// Tipado para DeepL
interface DeepLTranslationResponse {
  translations: Array<{
    detected_source_language: string;
    text: string;
  }>;
}

/**
 * Cliente de IA para Rexeat.
 * Gestiona digitalización con Gemini y traducciones con DeepL.
 */
export class AIClient {
  private genAI: GoogleGenerativeAI;
  private geminiModel: GenerativeModel;

  constructor(
    private readonly geminiApiKey: string,
    private readonly deeplApiKey: string,
  ) {
    this.genAI = new GoogleGenerativeAI(this.geminiApiKey);
    this.geminiModel = this.genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });
  }

  /**
   * Digitaliza una imagen de menú físico usando Gemini.
   */
  async digitizeMenu(
    imageBuffer: ArrayBuffer,
    mimeType: string,
  ): Promise<DigitizationItem[]> {
    const prompt = `
      Analiza esta imagen de un menú de restaurante.
      Extrae todos los platos, bebidas y productos con sus precios.
      Devuelve un objeto JSON con una lista llamada "items" donde cada objeto tenga:
      - "name": Nombre del producto.
      - "originalPriceText": Texto original del precio (ej: "12,50€").
      - "parsedPrice": El precio convertido a un número entero en céntimos (ej: 1250).
      - "confidence": Un número entre 0 y 1 indicando la confianza de la extracción.
      
      Reglas críticas:
      1. NO inventes precios.
      2. Si no hay precio claro, usa 0.
      3. Devuelve SOLO JSON puro, sin markdown.
    `;

    const base64Data = btoa(
      new Uint8Array(imageBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        "",
      ),
    );

    const result = await this.geminiModel.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    try {
      const cleanJson = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleanJson);

      const validated = DigitizationResponseSchema.parse({
        items: parsed.items,
        requestId: crypto.randomUUID(),
      });

      return validated.items;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Error al procesar Gemini:", e);
      throw new Error("No se pudo procesar la imagen del menú", { cause: e });
    }
  }

  async translateText(
    text: string,
    _sourceLang: string = "es",
  ): Promise<TranslatedString> {
    const targetLangs = ["en", "fr", "de", "nl", "it"] as const;
    const result: Partial<TranslatedString> = { es: text };

    await Promise.all(
      targetLangs.map(async (lang) => {
        try {
          const translated = await this.callDeepL(text, lang.toUpperCase());
          (result as any)[lang] = translated; // eslint-disable-line @typescript-eslint/no-explicit-any
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn(`Error DeepL (${lang}):`, e);
          (result as any)[lang] = ""; // eslint-disable-line @typescript-eslint/no-explicit-any
        }
      }),
    );

    return result as TranslatedString;
  }

  private async callDeepL(text: string, targetLang: string): Promise<string> {
    const url = `https://api-free.deepl.com/v2/translate`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${this.deeplApiKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        text,
        target_lang: targetLang === "EN" ? "EN-US" : targetLang,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepL error: ${response.statusText}`);
    }

    const data = (await response.json()) as DeepLTranslationResponse;
    return data.translations[0]?.text || "";
  }
}
