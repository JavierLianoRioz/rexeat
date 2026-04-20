/**
 * © 2026 Rexeat - Todos los derechos reservados.
 */
import React from 'react';

/**
 * SRP: Responsabilidad Única - Presentar el mensaje principal de la marca.
 */
export const HeroSection = () => {
  return (
    <section className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left py-12">
      <h1 className="text-5xl font-extrabold tracking-tight text-black dark:text-white sm:text-6xl">
        Rexeat: El Menú <span className="text-orange-600">Nativo</span>
      </h1>
      <p className="max-w-xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
        Transforma tu restaurante con menús digitales instantáneos mediante NFC y QR. 
        Sin PDFs, sin esperas, con gestión de stock en tiempo real.
      </p>
    </section>
  );
};
