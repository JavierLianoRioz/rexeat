import { z } from "zod";
import { TranslatedStringSchema } from "./i18n";
import { OrganizationIdSchema } from "./auth";

export const LocalSchema = z.object({
  id: z.uuid(),
  organizationId: OrganizationIdSchema,
  name: TranslatedStringSchema,
  slug: z.string().min(3),
  logoUrl: z.url().optional(),
});

export type Local = z.infer<typeof LocalSchema>;

export const ZoneSchema = z.object({
  id: z.uuid(),
  localId: z.uuid(),
  organizationId: OrganizationIdSchema,
  name: z.string().min(1),
  nfcToken: z.string().min(1), // El token ahora vive en la Zona (la tarjeta NFC)
});

export type Zone = z.infer<typeof ZoneSchema>;
