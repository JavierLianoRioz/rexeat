/**
 * © 2026 Rexeat - Todos los derechos reservados.
 */
import { HeroSection } from "@/components/landing/HeroSection";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import Link from "next/link";

/**
 * SRP: Responsabilidad Única - Componer la página de aterrizaje.
 * Sigue los principios de diseño de alta cohesión y bajo acoplamiento.
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-black font-sans selection:bg-orange-100">
      <main className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Navigation / Header simple */}
        <header className="flex h-20 items-center justify-between">
          <div className="text-2xl font-black text-black dark:text-white tracking-tighter">
            REXEAT<span className="text-orange-600">.</span>
          </div>
          <Link 
            href="/admin" 
            className="rounded-full bg-black dark:bg-white px-6 py-2.5 text-sm font-semibold text-white dark:text-black hover:opacity-80 transition-all"
          >
            Acceso Manager
          </Link>
        </header>

        {/* Hero Section - Boundary (Presentación) */}
        <HeroSection />

        {/* Action Buttons */}
        <div className="flex flex-col gap-4 sm:flex-row py-4">
          <Link
            href="/demo"
            className="flex h-12 items-center justify-center rounded-full bg-orange-600 px-8 text-white font-bold hover:bg-orange-700 transition-all"
          >
            Ver Demo Interactiva
          </Link>
          <Link
            href="/contact"
            className="flex h-12 items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-800 px-8 text-black dark:text-white font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all"
          >
            Saber más
          </Link>
        </div>

        {/* Features - Modularidad */}
        <FeatureGrid />

        {/* Footer */}
        <footer className="mt-auto border-t border-zinc-100 dark:border-zinc-900 py-12 text-sm text-zinc-500">
          © 2026 Rexeat. Todos los derechos reservados. Cumplimiento UE 1169/2011.
        </footer>
      </main>
    </div>
  );
}
