/**
 * © 2026 Rexeat - Todos los derechos reservados.
 * Este archivo está protegido bajo la licencia Polyform Non-Commercial 1.0.0.
 */
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import {
  type DigitizationItem,
  DigitizationResponseSchema,
} from "@rexeat/types";
import { type ITranslationService, TranslationService } from "./translation";

export interface DigitizationResult {
  items: DigitizationItem[];
  usage: {
    promptTokens: number;
    completionTokens: number;
    aiCostMillicents: number;
    translationCostMillicents: number;
    model: string;
  };
}

export class AIClient {
  private s3Client: S3Client;
  private readonly openRouterUrl =
    "https://openrouter.ai/api/v1/chat/completions";

  // Precios estimados en milicéntimos (1/1000 de céntimo)
  private readonly PRICE_PER_1M_INPUT_TOKENS = 100; // $0.10 / 1M = 100 milicéntimos
  private readonly PRICE_PER_1M_OUTPUT_TOKENS = 400; // $0.40 / 1M = 400 milicéntimos

  constructor(
    private readonly config: {
      openRouterApiKey: string;
      r2AccountId: string;
      r2AccessKeyId: string;
      r2SecretAccessKey: string;
      r2BucketName: string;
    },
    private readonly translationService: ITranslationService,
  ) {
    this.s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${config.r2AccountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.r2AccessKeyId,
        secretAccessKey: config.r2SecretAccessKey,
      },
    });
  }

  async digitizeMenu(
    imageBuffer: ArrayBuffer,
    mimeType: string,
    organizationId: string,
  ): Promise<DigitizationResult> {
    const requestId = crypto.randomUUID();
    const fileName = `${organizationId}/uploads/${requestId}.${mimeType.split("/")[1] || "jpg"}`;

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.config.r2BucketName,
          Key: fileName,
          Body: new Uint8Array(imageBuffer),
          ContentType: mimeType,
        }),
      );
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(
        "⚠️ Advertencia: Fallo al subir a R2, continuando solo con IA:",
        e,
      );
    }

    const prompt = this.getDigitizationPrompt();
    const base64Image = this.toBase64(imageBuffer);
    const model = "google/gemini-2.0-flash-001";

    const response = await fetch(this.openRouterUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.openRouterApiKey}`,
        "Content-Type": "application/json",
        "X-Title": "Rexeat API",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${base64Image}` },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const aiText = data.choices?.[0]?.message?.content;
    const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0 };

    // Calcular coste de IA
    const aiCost = Math.ceil(
      (usage.prompt_tokens * this.PRICE_PER_1M_INPUT_TOKENS) / 1000 +
        (usage.completion_tokens * this.PRICE_PER_1M_OUTPUT_TOKENS) / 1000,
    );

    if (!aiText) throw new Error("No response from AI");

    const items = await this.parseAIResponse(aiText, requestId);

    // 3. Traducción automática en bloque (DeepL)
    const translationResult = await this.translationService.translateBatch(
      items.map((item) => String(item.name)),
    );

    const finalItems = items.map((item, index) => ({
      ...item,
      price: item.parsedPrice || 0, // Inyectar el precio parseado
      name: translationResult.translations[index] || { es: String(item.name) },
    }));

    return {
      items: finalItems,
      usage: {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        aiCostMillicents: aiCost,
        translationCostMillicents: translationResult.usage.costEstimate,
        model,
      },
    };
  }

  private getDigitizationPrompt(): string {
    return `
      Eres un experto en digitalización de menús de restaurantes. 
      Analiza la imagen adjunta y extrae todos los productos, platos y bebidas.

      ### REGLA DE ORO DE CONTEXTO (CRÍTICA):
      Los menús suelen estar organizados por secciones (ej: "TOSTADAS", "TACOS", "ENTRANTES"). 
      Si un producto está bajo una sección y su nombre es incompleto (ej: "de Atún", "de Pollo"), DEBES reconstruir el nombre completo usando el contexto de la sección.
      - Ejemplo: Sección "TOSTADAS" + Producto "de Atún" => Nombre: "Tostada de Atún".
      - Ejemplo: Sección "TACOS" + Producto "Pastor" => Nombre: "Taco al Pastor".

      Para cada ítem, identifica:
      1. Nombre descriptivo completo (reconstruido con su sección si es necesario).
      2. Precio: Busca números a la derecha del nombre o debajo. Ignora números de alérgenos.

      Devuelve un objeto JSON con una lista llamada "items" donde cada objeto sea:
      - "name": Nombre completo y descriptivo del producto.
      - "originalPriceText": El texto tal cual aparece (ej: "12,50", "9.00€").
      - "parsedPrice": El valor en CÉNTIMOS (ej: 1250). Si no hay precio, usa 0.
      - "confidence": Nivel de confianza (0.0 a 1.0).

      Reglas Adicionales:
      - NO inventes datos.
      - Devuelve exclusivamente JSON puro sin etiquetas de markdown.
    `;
  }

  private toBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]!);
    }
    return btoa(binary);
  }

  private async parseAIResponse(
    text: string,
    requestId: string,
  ): Promise<DigitizationItem[]> {
    try {
      const parsed = JSON.parse(text);
      const validated = DigitizationResponseSchema.parse({
        items: parsed.items,
        requestId,
      });
      return validated.items;
    } catch (e) {
      throw new Error(`Failed to parse AI output: ${text}`, { cause: e });
    }
  }
}

export function getAIClient() {
  const openRouterApiKey = process.env["OPENROUTER_API_KEY"];
  const deeplApiKey = process.env["DEEPL_API_KEY"];
  const r2AccountId = process.env["R2_ACCOUNT_ID"];
  const r2AccessKeyId = process.env["R2_ACCESS_KEY_ID"];
  const r2SecretAccessKey = process.env["R2_SECRET_ACCESS_KEY"];
  const r2BucketName = process.env["R2_BUCKET_NAME"];

  if (
    !openRouterApiKey ||
    !deeplApiKey ||
    !r2AccountId ||
    !r2AccessKeyId ||
    !r2SecretAccessKey ||
    !r2BucketName
  ) {
    throw new Error(
      "Servicios de IA o Almacenamiento no configurados (Falta OPENROUTER_API_KEY o R2 config)",
    );
  }

  const translationService = new TranslationService(deeplApiKey);

  return new AIClient(
    {
      openRouterApiKey,
      r2AccountId,
      r2AccessKeyId,
      r2SecretAccessKey,
      r2BucketName,
    },
    translationService,
  );
}
