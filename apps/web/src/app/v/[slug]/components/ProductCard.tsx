import Image from "next/image";
import { MenuProduct } from "../types";

interface ProductCardProps {
  product: MenuProduct;
  allergenIcons: Record<string, string>;
}

export function ProductCard({ product, allergenIcons }: ProductCardProps) {
  const activeAllergens = Object.entries(product.allergens)
    .filter(([_, active]) => active)
    .map(([key]) => key);

  return (
    <div
      className="flex gap-4 items-center bg-white p-3 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md animate-in fade-in slide-in-from-bottom-2"
    >
      {product.image && (
        <div className="relative w-24 h-24 flex-shrink-0">
          <Image
            src={product.image.url}
            alt={product.name.es}
            fill
            className="rounded-xl object-cover"
            placeholder={product.image.blurHash ? "blur" : "empty"}
            blurDataURL={product.image.blurHash}
            sizes="96px"
          />
        </div>
      )}
      <div className="flex-1 flex flex-col justify-between h-full min-h-[96px]">
        <div>
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-bold text-gray-900 leading-tight flex-1">
              {product.name.es}
            </h3>
            <span className="text-orange-600 font-black text-lg whitespace-nowrap">
              {(product.price / 100).toFixed(2)}€
            </span>
          </div>
          {product.description?.es && (
            <p className="text-xs text-gray-500 line-clamp-2 mt-1 font-medium">
              {product.description.es}
            </p>
          )}
        </div>

        {activeAllergens.length > 0 && (
          <div className="flex flex-col gap-2 mt-2">
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar" aria-label="Alérgenos">
              {activeAllergens.map((key) => (
                <div
                  key={key}
                  className="w-6 h-6 bg-orange-50 rounded-full flex items-center justify-center border border-orange-100 shrink-0"
                  title={key}
                >
                  <span className="text-xs" role="img" aria-label={key}>
                    {allergenIcons[key] || "❓"}
                  </span>
                </div>
              ))}
            </div>
            {!product.allergensConfirmed && (
              <p className="text-[10px] text-red-500 font-bold uppercase tracking-tight italic">
                ⚠️ Pendiente de confirmación. Consulte con el personal.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
