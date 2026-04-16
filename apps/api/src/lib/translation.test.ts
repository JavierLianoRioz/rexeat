/**
 * © 2026 Rexeat - Todos los derechos reservados.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TranslationService } from "./translation";

describe("TranslationService - Unit Tests (TDD)", () => {
  const mockApiKey = "test_key";
  let service: TranslationService;

  beforeEach(() => {
    service = new TranslationService(mockApiKey);
    vi.stubGlobal("fetch", vi.fn());
  });

  it("debería traducir un lote de textos correctamente (Batching)", async () => {
    const texts = ["Hola", "Mundo"];

    // Mock de respuesta de DeepL
    const mockResponse = {
      translations: [{ text: "Hello" }, { text: "World" }],
    };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await service.translateBatch(texts);

    // Verificar que se llamó a la API con los parámetros correctos (Batching)
    expect(fetch).toHaveBeenCalledTimes(5); // Una vez por cada idioma de destino

    // Verificar estructura del primer resultado (Inglés)
    expect(result.translations[0]?.es).toBe("Hola");
    expect(result.translations[0]?.en).toBe("Hello");
    expect(result.translations[1]?.en).toBe("World");
    expect(result.usage.costEstimate).toBeGreaterThan(0);
  });

  it("debería manejar errores de red graciosamente (Resiliencia)", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "DeepL Error",
    } as Response);

    const result = await service.translateBatch(["Error"]);

    expect(result.translations[0]?.es).toBe("Error");
    expect(result.translations[0]?.en).toBe(""); // Fallback a vacío
  });
});
