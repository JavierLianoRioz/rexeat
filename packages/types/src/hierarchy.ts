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
});

export type Zone = z.infer<typeof ZoneSchema>;

export const TableSchema = z.object({
  id: z.uuid(),
  zoneId: z.uuid(),
  localId: z.uuid(),
  organizationId: OrganizationIdSchema,
  number: z.string().min(1),
  nfcToken: z.string().min(1),
});

export type Table = z.infer<typeof TableSchema>;
