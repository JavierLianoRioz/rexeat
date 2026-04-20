import { MenuCategory } from "../types";

interface CategoryNavProps {
  categories: MenuCategory[];
}

export function CategoryNav({ categories }: CategoryNavProps) {
  return (
    <nav className="sticky top-[97px] z-20 bg-white/90 backdrop-blur-xl border-b border-gray-100 flex overflow-x-auto no-scrollbar py-3 px-4 gap-2 shadow-sm">
      {categories.map((cat) => (
        <a
          key={cat.id}
          href={`#cat-${cat.id}`}
          className="whitespace-nowrap px-4 py-1.5 rounded-full bg-gray-100 text-gray-600 text-xs font-bold uppercase tracking-wide hover:bg-orange-500 hover:text-white transition-colors"
        >
          {cat.name.es}
        </a>
      ))}
    </nav>
  );
}
