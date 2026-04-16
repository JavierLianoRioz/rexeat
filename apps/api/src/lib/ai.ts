/**
 * © 2026 Rexeat - Todos los derechos reservados.
 * Este archivo está protegido bajo la licencia Polyform Non-Commercial 1.0.0.
 */
import {
  GoogleGenerativeAI,
  type GenerativeModel,
} from "@google/generative-ai";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import {
  type DigitizationItem,
  DigitizationResponseSchema,
} from "@rexeat/types";
import { TranslationService } from "./translation";

export class AIClient {
  private genAI: GoogleGenerativeAI;
  private geminiModel: GenerativeModel;
  private s3Client: S3Client;
  private translationService: TranslationService;

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

    this.translationService = new TranslationService(config.deeplApiKey);
  }

  async digitizeMenu(
    imageBuffer: ArrayBuffer,
    mimeType: string,
    organizationId: string,
  ): Promise<DigitizationItem[]> {
    const requestId = crypto.randomUUID();
    const fileName = `${organizationId}/uploads/${requestId}.${mimeType.split("/")[1] || "jpg"}`;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.config.r2BucketName,
        Key: fileName,
        Body: new Uint8Array(imageBuffer),
        ContentType: mimeType,
      }),
    );

    const prompt = this.getDigitizationPrompt();
    const base64Image = this.toBase64(imageBuffer);

    const result = await this.geminiModel.generateContent([
      prompt,
      { inlineData: { data: base64Image, mimeType } },
    ]);

    const response = await result.response;
    const items = await this.parseGeminiResponse(response.text(), requestId);

    const translatedNames = await this.translationService.translateBatch(
      items.map((item) => String(item.name)),
    );

    return items.map((item, index) => ({
      ...item,
      name: translatedNames[index] || { es: String(item.name) },
    }));
  }

  private getDigitizationPrompt(): string {
    return `
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
  }

  private toBase64(buffer: ArrayBuffer): string {
    return btoa(
      new Uint8Array(buffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        "",
      ),
    );
  }

  private async parseGeminiResponse(
    text: string,
    requestId: string,
  ): Promise<DigitizationItem[]> {
    try {
      const cleanJson = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleanJson);
      const validated = DigitizationResponseSchema.parse({
        items: parsed.items,
        requestId,
      });
      return validated.items;
    } catch (e) {
      throw new Error(
        `Failed to parse menu: ${e instanceof Error ? e.message : String(e)}`,
        { cause: e },
      );
    }
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
