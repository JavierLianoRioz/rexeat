/**
 * © 2026 Rexeat - Todos los derechos reservados.
 * Tests para la lógica de resolución de idiomas y fallbacks.
 */
import { describe, it, expect } from "vitest";
import { i18n } from "./i18n";

describe("i18n - Resolución de Idiomas y Fallbacks", () => {
  it("debería resolver variantes latinas a español (Castellano)", () => {
    expect(i18n.resolve("es-MX")).toBe("es");
    expect(i18n.resolve("es-AR")).toBe("es");
    expect(i18n.resolve("ES-cl")).toBe("es");
  });

  it("debería resolver idiomas soportados directamente", () => {
    expect(i18n.resolve("fr")).toBe("fr");
    expect(i18n.resolve("de-DE")).toBe("de");
    expect(i18n.resolve("it")).toBe("it");
  });

  it("debería hacer fallback a Inglés para idiomas no-castellanos no soportados", () => {
    expect(i18n.resolve("ru")).toBe("en"); // Ruso -> Inglés
    expect(i18n.resolve("ja-JP")).toBe("en"); // Japonés -> Inglés
    expect(i18n.resolve("pt-BR")).toBe("en"); // Portugués -> Inglés (no empieza por 'es')
  });

  it("debería manejar casos vacíos o extraños", () => {
    expect(i18n.resolve("")).toBe("en");
    expect(i18n.resolve("unknown")).toBe("en");
  });
});
