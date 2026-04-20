/**
 * © 2026 Rexeat - Todos los derechos reservados.
 */
import React from 'react';

const features = [
  {
    title: "NFC Instantáneo",
    description: "Toca con tu móvil y abre el menú en < 1.2s.",
    icon: "⚡",
  },
  {
    title: "Alérgenos Seguros",
    description: "Filtrado visual conforme a la normativa UE 1169/2011.",
    icon: "🛡️",
  },
  {
    title: "Stock en Vivo",
    description: "Oculta platos agotados al instante desde tu móvil.",
    icon: "🔄",
  },
];

export const FeatureGrid = () => {
  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 py-12">
      {features.map((feature) => (
        <div key={feature.title} className="flex flex-col gap-4 p-6 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <span className="text-3xl">{feature.icon}</span>
          <h3 className="text-xl font-bold text-black dark:text-white">{feature.title}</h3>
          <p className="text-zinc-600 dark:text-zinc-400">{feature.description}</p>
        </div>
      ))}
    </div>
  );
};
