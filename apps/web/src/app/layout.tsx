/**
 * © 2026 Rexeat - Todos los derechos reservados.
 * Este archivo está protegido bajo la licencia Polyform Non-Commercial 1.0.0.
 */
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider, SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";

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
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable}`}
      style={{ height: '100%', WebkitFontSmoothing: 'antialiased' }}
    >
      <body style={{ minHeight: '100%', margin: 0, display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-geist-sans)' }}>
        <ClerkProvider>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid #eaeaea', backgroundColor: 'white', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#ea580c' }}>Rexeat</div>
            <nav>
              <Show when="signed-out">
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <SignInButton mode="modal">
                    <button style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 500, color: '#374151', background: 'none', border: 'none', cursor: 'pointer' }}>
                      Entrar
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 500, backgroundColor: '#ea580c', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}>
                      Empezar gratis
                    </button>
                  </SignUpButton>
                </div>
              </Show>
              <Show when="signed-in">
                <UserButton />
              </Show>
            </nav>
          </header>
          <main style={{ flex: 1 }}>
            {children}
          </main>
        </ClerkProvider>
      </body>
    </html>
  );
}
