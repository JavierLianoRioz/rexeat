/**
 * @rexeat/types - Shared TypeScript definitions for Rexeat.
 *
 * Centralized Source of Truth for domain entities, DTOs, and utility types.
 */

// --- Base Domains ---

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Menu {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  isActive: boolean;
  categories: Category[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  menuId: string;
  name: string;
  order: number;
  items: MenuItem[];
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number; // Stored in cents (e.g., 1250 = 12.50)
  imageUrl?: string;
  allergens: Allergen[];
  isAvailable: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
}

// --- Enums & Value Objects ---

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

export type Currency = "EUR" | "USD" | "GBP";

// --- API DTOs (Data Transfer Objects) ---

/**
 * Optimized response for the public customer-facing menu.
 */
export interface PublicMenuResponse {
  tenant: Pick<Tenant, "name" | "logoUrl" | "primaryColor" | "accentColor">;
  menu: Omit<Menu, "tenantId" | "createdAt" | "updatedAt">;
}

/**
 * Standard API error response.
 */
export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}
