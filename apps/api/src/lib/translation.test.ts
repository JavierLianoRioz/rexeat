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

    const results = await service.translateBatch(texts);

    // Verificar que se llamó a la API con los parámetros correctos (Batching)
    expect(fetch).toHaveBeenCalledTimes(5); // Una vez por cada idioma de destino (en, fr, de, nl, it)

    // Verificar estructura del primer resultado (Inglés)
    expect(results[0]?.es).toBe("Hola");
    expect(results[0]?.en).toBe("Hello");
    expect(results[1]?.en).toBe("World");
  });

  it("debería manejar errores de red graciosamente (Resiliencia)", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "DeepL Error",
    } as Response);

    const results = await service.translateBatch(["Error"]);

    expect(results[0]?.es).toBe("Error");
    expect(results[0]?.en).toBe(""); // Fallback a vacío
  });
});
