/**
 * © 2026 Rexeat - Todos los derechos reservados.
 * Este archivo está protegido bajo la licencia Polyform Non-Commercial 1.0.0.
 */
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
  id: z.string().uuid(),
  localId: z.string().uuid(),
  organizationId: OrganizationIdSchema,
  name: z.string().min(1),
  slug: z.string().min(1), // Identificador semántico (ej: 'barra', 'terraza')
});

export type Zone = z.infer<typeof ZoneSchema>;
