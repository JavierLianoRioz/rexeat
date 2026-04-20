/**
 * © 2026 Rexeat - Todos los derechos reservados.
 * Este archivo está protegido bajo la licencia Polyform Non-Commercial 1.0.0.
 */
import { type ITenantRepository } from "@rexeat/db";
import { getAIClient, type DigitizationResult } from "../ai";
import { TranslationService } from "../translation";

/**
 * Capa de Control (BCE) - AIService
 * Orquesta la lógica de IA, Traducción y Auditoría.
 * Sigue el DIP (Inversión de Dependencias) al depender de una interfaz.
 */
export class AIService {
  constructor(
    private readonly orgId: string,
    private readonly repo: ITenantRepository
  ) {}

  /**
   * Ejecuta el flujo completo de digitalización y audita el consumo.
   */
  async digitizeMenu(imageBuffer: ArrayBuffer, mimeType: string): Promise<DigitizationResult> {
    const aiClient = getAIClient();

    // 1. Llamada a la Entidad Externa (IA)
    const result = await aiClient.digitizeMenu(imageBuffer, mimeType, this.orgId);

    // 2. Orquestación de Auditoría vía Repositorio (Clean Architecture)
    await this.repo.logUsage([
      {
        service: "openrouter",
        model: result.usage.model,
        inputAmount: result.usage.promptTokens,
        outputAmount: result.usage.completionTokens,
        costEstimate: result.usage.aiCostMillicents,
      },
      {
        service: "deepl",
        model: "deepl-v2",
        inputAmount: 0,
        costEstimate: result.usage.translationCostMillicents,
      }
    ]);

    return result;
  }

        inputAmount: 0,
        costEstimate: result.usage.translationCostMillicents,
      },
    ]);

    return result;
  }

  /**
   * Ejecuta traducción masiva y audita consumo.
   */
  async translateBatch(texts: string[]) {
    const deeplKey = process.env["DEEPL_API_KEY"];
    if (!deeplKey)
      throw new Error("Infrastructure Error: DeepL API Key missing");

    const translationService = new TranslationService(deeplKey);
    const result = await translationService.translateBatch(texts);

    await this.repo.logUsage([
      {
        service: "deepl",
        model: "deepl-v2",
        inputAmount: result.usage.characters,
        costEstimate: result.usage.costEstimate,
      },
    ]);

    return result;
  }
}
