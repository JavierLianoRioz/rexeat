"use client";

import { useState, useMemo, useCallback } from "react";
import { MenuData, MenuProduct } from "./types";
import { ProductCard } from "./components/ProductCard";
import { AllergenFilter } from "./components/AllergenFilter";
import { CategoryNav } from "./components/CategoryNav";

const ALLERGEN_ICONS: Record<string, string> = {
  gluten: "🌾",
  crustaceos: "🦀",
  huevos: "🥚",
  pescado: "🐟",
  cacahuetes: "🥜",
  soja: "🫘",
  lacteos: "🥛",
  frutos_cascara: "🌰",
  apio: "🌿",
  mostaza: "🌭",
  sesamo: "🥯",
  dioxido_azufre: "🧪",
  altramuces: "🌱",
  moluscos: "🐚",
};

interface MenuContentProps {
  data: MenuData;
}

export default function MenuContent({ data }: MenuContentProps) {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const toggleFilter = useCallback((allergen: string) => {
    setActiveFilters((prev) =>
      prev.includes(allergen)
        ? prev.filter((a) => a !== allergen)
        : [...prev, allergen]
    );
  }, []);

  const filteredCategories = useMemo(() => {
    return data.menu.categories.map((cat) => ({
      ...cat,
      products: cat.products.filter((prod) => {
        if (activeFilters.length === 0) return true;
        
        // Regla de Seguridad Rexeat: Si no está confirmado, no es seguro bajo ningún filtro
        if (!prod.allergensConfirmed) return false;

        // Ocultar si el producto contiene alguno de los alérgenos seleccionados
        return !activeFilters.some((filter) => prod.allergens[filter]);
      }),
    })).filter((cat) => cat.products.length > 0);
  }, [data.menu.categories, activeFilters]);

  return (
    <div className="flex flex-col min-h-screen">
      <AllergenFilter 
        activeFilters={activeFilters} 
        onToggle={toggleFilter} 
        allergenIcons={ALLERGEN_ICONS} 
      />
      
      <CategoryNav categories={data.menu.categories} />

      <main className="p-4 flex flex-col gap-10 mt-2 flex-1">
        {filteredCategories.map((cat) => (
          <section key={cat.id} id={`cat-${cat.id}`} className="relative scroll-mt-[160px]">
            <header className="sticky top-[145px] bg-gray-50/95 backdrop-blur-md z-10 py-3 mb-4 -mx-4 px-4 border-b border-gray-200/50">
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter">
                {cat.name.es}
              </h2>
            </header>
            
            <div className="flex flex-col gap-6">
              {cat.products.map((prod: MenuProduct) => (
                <ProductCard 
                  key={prod.id} 
                  product={prod} 
                  allergenIcons={ALLERGEN_ICONS} 
                />
              ))}
            </div>
          </section>
        ))}

        {filteredCategories.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-4xl mb-4">🔍</span>
            <p className="text-gray-500 font-bold">No hay productos que coincidan con tus filtros.</p>
            <button 
              onClick={() => setActiveFilters([])}
              className="mt-4 text-orange-600 font-black uppercase text-xs tracking-widest border-b-2 border-orange-600 pb-1"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
