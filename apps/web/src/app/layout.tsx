/**
 * © 2026 Rexeat - Todos los derechos reservados.
 * Este archivo está protegido bajo la licencia Polyform Non-Commercial 1.0.0.
 */
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rexeat - Menú Digital",
  description: "La evolución digital de tu restaurante",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-gray-50 font-sans antialiased text-gray-900">
        <header className="flex h-16 items-center justify-between px-6 bg-white border-b border-gray-100 sticky top-0 z-50">
          <div className="text-xl font-black text-orange-600 tracking-tighter">
            REXEAT<span className="text-gray-300">.</span>
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
            Dev Mode
          </div>
        </header>
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
