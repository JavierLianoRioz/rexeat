/**
 * © 2026 Rexeat - Todos los derechos reservados.
 * Este archivo está protegido bajo la licencia Polyform Non-Commercial 1.0.0.
 */
import { z } from "zod";
import { CentsSchema } from "./money";
import { TranslatedStringSchema } from "./i18n";

export const ImageMetadataSchema = z.object({
  url: z.string().url(),
  blurHash: z.string().min(1),
  width: z.number().positive(),
  height: z.number().positive(),
});

export type ImageMetadata = z.infer<typeof ImageMetadataSchema>;

export const ConfidenceScoreSchema = z.number().min(0).max(1);
export type ConfidenceScore = z.infer<typeof ConfidenceScoreSchema>;

export const DigitizationItemSchema = z.object({
  name: TranslatedStringSchema,
  originalPriceText: z.string(),
  parsedPrice: CentsSchema,
  confidence: ConfidenceScoreSchema,
});

export type DigitizationItem = z.infer<typeof DigitizationItemSchema>;

export const DigitizationResponseSchema = z.object({
  items: z.array(DigitizationItemSchema),
  requestId: z.string().uuid(),
});

export type DigitizationResponse = z.infer<typeof DigitizationResponseSchema>;
