import {
  GoogleGenerativeAI,
  type GenerativeModel,
} from "@google/generative-ai";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
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
 * Gestiona digitalización con Gemini, traducciones con DeepL y persistencia en R2.
 */
export class AIClient {
  private genAI: GoogleGenerativeAI;
  private geminiModel: GenerativeModel;
  private s3Client: S3Client;

  constructor(
    private readonly config: {
      geminiApiKey: string;
      deeplApiKey: string;
      r2AccountId: string;
      r2AccessKeyId: string;
      r2SecretAccessKey: string;
      r2BucketName: string;
    },
  ) {
    this.genAI = new GoogleGenerativeAI(config.geminiApiKey);
    this.geminiModel = this.genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    this.s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${config.r2AccountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.r2AccessKeyId,
        secretAccessKey: config.r2SecretAccessKey,
      },
    });
  }

  /**
   * Digitaliza una imagen de menú físico usando Gemini y la persiste en R2.
   */
  async digitizeMenu(
    imageBuffer: ArrayBuffer,
    mimeType: string,
    organizationId: string,
  ): Promise<DigitizationItem[]> {
    const requestId = crypto.randomUUID();
    const fileExtension = mimeType.split("/")[1] || "jpg";
    const fileName = `${organizationId}/uploads/${requestId}.${fileExtension}`;

    // 1. Persistencia en R2 (Auditoría y almacenamiento)
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.config.r2BucketName,
        Key: fileName,
        Body: new Uint8Array(imageBuffer),
        ContentType: mimeType,
      }),
    );

    // 2. Procesamiento con Gemini
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
        requestId,
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
    const result: TranslatedString = {
      es: text,
      en: "",
      fr: "",
      de: "",
      nl: "",
      it: "",
    };

    await Promise.all(
      targetLangs.map(async (lang) => {
        try {
          const translated = await this.callDeepL(text, lang.toUpperCase());
          result[lang] = translated;
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn(`Error DeepL (${lang}):`, e);
          result[lang] = "";
        }
      }),
    );

    return result;
  }

  private async callDeepL(text: string, targetLang: string): Promise<string> {
    const url = `https://api-free.deepl.com/v2/translate`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${this.config.deeplApiKey}`,
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

interface AIClientConfig {
  geminiApiKey: string;
  deeplApiKey: string;
  r2AccountId: string;
  r2AccessKeyId: string;
  r2SecretAccessKey: string;
  r2BucketName: string;
}

/**
 * Factory para obtener una instancia configurada de AIClient.
 */
export function getAIClient() {
  const config = {
    geminiApiKey: process.env["GEMINI_API_KEY"],
    deeplApiKey: process.env["DEEPL_API_KEY"],
    r2AccountId: process.env["R2_ACCOUNT_ID"],
    r2AccessKeyId: process.env["R2_ACCESS_KEY_ID"],
    r2SecretAccessKey: process.env["R2_SECRET_ACCESS_KEY"],
    r2BucketName: process.env["R2_BUCKET_NAME"],
  };

  if (Object.values(config).some((v) => !v)) {
    throw new Error("Servicios de IA o Almacenamiento no configurados");
  }

  return new AIClient(config as AIClientConfig);
}
