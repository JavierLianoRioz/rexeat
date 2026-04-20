interface AllergenFilterProps {
  activeFilters: string[];
  onToggle: (id: string) => void;
  allergenIcons: Record<string, string>;
}

export function AllergenFilter({ activeFilters, onToggle, allergenIcons }: AllergenFilterProps) {
  return (
    <div className="bg-white px-4 py-4 border-b border-gray-100 overflow-x-auto flex gap-3 no-scrollbar sticky top-0 z-30 shadow-sm">
      {Object.entries(allergenIcons).map(([id, icon]) => {
        const isActive = activeFilters.includes(id);
        return (
          <button
            key={id}
            onClick={() => onToggle(id)}
            aria-pressed={isActive}
            className={`flex flex-col items-center justify-center min-w-[64px] h-16 rounded-xl border-2 transition-all ${
              isActive
                ? "border-orange-500 bg-orange-50 ring-2 ring-orange-100"
                : "border-gray-100 bg-gray-50 opacity-60 grayscale"
            }`}
          >
            <span className="text-xl" role="img" aria-label={id}>{icon}</span>
            <span className="text-[9px] font-black uppercase mt-1 text-gray-500">
              {id.substring(0, 6)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
