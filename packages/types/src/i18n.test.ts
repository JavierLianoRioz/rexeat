import { describe, it, expect } from "vitest";
import { i18n, type TranslatedString } from "./i18n";

describe("i18n.get helper", () => {
  const fullText: TranslatedString = {
    es: "Hola",
    en: "Hello",
    fr: "Bonjour",
    de: "Hallo",
    nl: "Hoi",
    it: "Ciao",
  };

  it("should return the requested language if available", () => {
    expect(i18n.get(fullText, "fr")).toBe("Bonjour");
    expect(i18n.get(fullText, "it")).toBe("Ciao");
  });

  it("should fallback to English if the requested language is missing", () => {
    const missingFr: TranslatedString = { es: "Hola", en: "Hello" };
    expect(i18n.get(missingFr, "fr")).toBe("Hello");
  });

  it("should fallback to Spanish if English is also missing", () => {
    const onlyEs: TranslatedString = { es: "Hola" };
    expect(i18n.get(onlyEs, "de")).toBe("Hola");
  });

  it("should return the first available translation if ES and EN are missing (edge case)", () => {
    // @ts-expect-error - testing invalid state where es is missing
    const onlyFr: TranslatedString = { fr: "Bonjour" };
    expect(i18n.get(onlyFr, "it")).toBe("Bonjour");
  });

  it("should return 'No translation' if object is empty or null", () => {
    expect(i18n.get({} as TranslatedString, "en")).toBe("No translation");
    expect(i18n.get(null as unknown as TranslatedString, "en")).toBe(
      "No translation",
    );
  });

  it("should handle empty strings by treating them as missing", () => {
    const emptyEn: TranslatedString = { es: "Hola", en: "" };
    expect(i18n.get(emptyEn, "en")).toBe("Hola");

    const blankEn: TranslatedString = { es: "Hola", en: "   " };
    expect(i18n.get(blankEn, "en")).toBe("Hola");
  });
});
