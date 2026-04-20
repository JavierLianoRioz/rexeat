import { AllergenMap } from "@rexeat/types";

export interface MenuProduct {
  id: string;
  name: { es: string; [key: string]: string };
  description?: { es: string; [key: string]: string };
  price: number;
  allergens: AllergenMap;
  allergensConfirmed: boolean;
  image?: {
    url: string;
    blurHash?: string;
  };
}

export interface MenuCategory {
  id: string;
  name: { es: string; [key: string]: string };
  products: MenuProduct[];
}

export interface MenuData {
  organization: {
    name: string;
    logo?: string;
  };
  menu: {
    categories: MenuCategory[];
  };
}
