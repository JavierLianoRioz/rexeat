import { z } from "zod";

export const AllergenEnumSchema = z.enum([
  "gluten",
  "crustaceos",
  "huevos",
  "pescado",
  "cacahuetes",
  "soja",
  "lacteos",
  "frutos_cascara",
  "apio",
  "mostaza",
  "sesamo",
  "dioxido_azufre",
  "altramuces",
  "moluscos",
]);

export type Allergen = z.infer<typeof AllergenEnumSchema>;

export const AllergenMapSchema = z
  .record(z.string(), z.boolean())
  .refine(
    (map) =>
      Object.keys(map).every(
        (key) => AllergenEnumSchema.safeParse(key).success,
      ),
    { message: "Invalid allergen key" },
  );

export type AllergenMap = z.infer<typeof AllergenMapSchema>;

export const AvailabilityStatusSchema = z.enum([
  "in_stock",
  "out_of_stock",
  "hidden",
  "temporarily_unavailable",
]);

export type AvailabilityStatus = z.infer<typeof AvailabilityStatusSchema>;
