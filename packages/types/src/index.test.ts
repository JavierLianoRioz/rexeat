import { describe, it, expect } from "vitest";
import {
  Money,
  CentsSchema,
  TranslatedStringSchema,
  OrganizationIdSchema,
  AllergenMapSchema,
} from "./index";

describe("Rexeat Core Logic (ADN)", () => {
  describe("Money & Cents", () => {
    it("should format cents to display currency correctly", () => {
      // Reemplazamos espacios de no-ruptura por normales para comparar
      const result = Money.toDisplay(1250).replace(/\u00a0/g, " ");
      expect(result).toBe("12,50 €");
    });

    it("should validate that cents are non-negative integers", () => {
      expect(CentsSchema.safeParse(100).success).toBe(true);
      expect(CentsSchema.safeParse(-50).success).toBe(false);
      expect(CentsSchema.safeParse(10.5).success).toBe(false);
    });
  });

  describe("i18n (Translations)", () => {
    it("should require Spanish (es) as base language", () => {
      const valid = { es: "Hola", en: "Hello" };
      const invalid = { en: "Hello" };

      expect(TranslatedStringSchema.safeParse(valid).success).toBe(true);
      expect(TranslatedStringSchema.safeParse(invalid).success).toBe(false);
    });

    it("should reject empty strings for base language", () => {
      expect(TranslatedStringSchema.safeParse({ es: "" }).success).toBe(false);
    });
  });

  describe("Security (Multi-tenant)", () => {
    it("should validate that OrganizationId starts with org_", () => {
      expect(OrganizationIdSchema.safeParse("org_123").success).toBe(true);
      expect(OrganizationIdSchema.safeParse("user_123").success).toBe(false);
    });
  });

  describe("Food Safety (Allergens)", () => {
    it("should validate a partial allergen map", () => {
      const validMap = { gluten: true, lacteos: false };
      expect(AllergenMapSchema.safeParse(validMap).success).toBe(true);
    });

    it("should reject unknown allergens", () => {
      const invalidMap = { kruptonita: true };
      expect(AllergenMapSchema.safeParse(invalidMap).success).toBe(false);
    });
  });
});
