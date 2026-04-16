/**
 * © 2026 Rexeat - Todos los derechos reservados.
 */
import { describe, it, expect } from "vitest";
import { i18n, type TranslatedString } from "./i18n";

describe("i18n.get - Cadena de Fallback (TDD)", () => {
  const ts: TranslatedString = {
    es: "Hola (ES)",
    en: "Hello (EN)",
    fr: "Bonjour (FR)",
  };

  it("debería devolver el idioma solicitado si existe", () => {
    expect(i18n.get(ts, "fr")).toBe("Bonjour (FR)");
  });

  it("debería hacer fallback a EN si el solicitado no existe", () => {
    // Solicitamos Alemán (de), pero no está en 'ts'. Debe ir a 'en'.
    expect(i18n.get(ts, "de")).toBe("Hello (EN)");
  });

  it("debería hacer fallback a ES si ni el solicitado ni el EN existen", () => {
    const tsSmall: TranslatedString = { es: "Solo Español" };
    // Solicitamos Francés (fr), no hay FR ni EN -> debe devolver ES.
    expect(i18n.get(tsSmall, "fr")).toBe("Solo Español");
  });

  it("debería hacer fallback a ES si se solicita EN y no existe", () => {
    const tsNoEn: TranslatedString = { es: "Solo Español" };
    expect(i18n.get(tsNoEn, "en")).toBe("Solo Español");
  });

  it("debería devolver 'No translation' si ni siquiera hay español", () => {
    // @ts-expect-error - Caso extremo de objeto vacío
    expect(i18n.get({}, "fr")).toBe("No translation");
  });
});

describe("i18n.resolve - Resolución de Idioma", () => {
  it("debería resolver variantes de español a 'es'", () => {
    expect(i18n.resolve("es-MX")).toBe("es");
    expect(i18n.resolve("es-AR")).toBe("es");
  });

  it("debería resolver idiomas desconocidos a 'en' (como puente)", () => {
    expect(i18n.resolve("ru")).toBe("en");
    expect(i18n.resolve("ja")).toBe("en");
  });
});
