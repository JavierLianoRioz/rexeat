/**
 * @rexeat/types - Shared TypeScript definitions for Rexeat.
 */

export interface Tenant {
  id: string;
  name: string;
  slug: string;
}

export type Allergen =
  | "gluten"
  | "crustaceans"
  | "eggs"
  | "fish"
  | "peanuts"
  | "soybeans"
  | "milk"
  | "nuts"
  | "celery"
  | "mustard"
  | "sesame"
  | "sulphites"
  | "lupin"
  | "molluscs";
