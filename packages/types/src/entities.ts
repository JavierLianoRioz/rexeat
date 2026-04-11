import { z } from "zod";
import { TranslatedStringSchema } from "./i18n";
import { CentsSchema } from "./money";
import { AllergenMapSchema, AvailabilityStatusSchema } from "./allergens";
import { ImageMetadataSchema } from "./ai";
import { OrganizationIdSchema } from "./auth";

export const ProductSchema = z.object({
  id: z.uuid(),
  organizationId: OrganizationIdSchema,
  name: TranslatedStringSchema,
  description: TranslatedStringSchema,
  price: CentsSchema,
  allergens: AllergenMapSchema,
  status: AvailabilityStatusSchema,
  image: ImageMetadataSchema.optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Product = z.infer<typeof ProductSchema>;

export const CategorySchema = z.object({
  id: z.uuid(),
  organizationId: OrganizationIdSchema,
  name: TranslatedStringSchema,
  order: z.number().int().nonnegative(),
  products: z.array(z.uuid()),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Category = z.infer<typeof CategorySchema>;

export const MenuSchema = z.object({
  id: z.uuid(),
  organizationId: OrganizationIdSchema,
  localId: z.uuid(),
  name: TranslatedStringSchema,
  categories: z.array(CategorySchema),
});

export type Menu = z.infer<typeof MenuSchema>;
