import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider, SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
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
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider>
          <header className="flex justify-between items-center p-4 border-b bg-white shadow-sm">
            <div className="text-xl font-bold text-orange-600">Rexeat</div>
            <nav>
              <Show when="signed-out">
                <div className="flex gap-4">
                  <SignInButton mode="modal">
                    <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors">
                      Entrar
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="px-4 py-2 text-sm font-medium bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors">
                      Empezar gratis
                    </button>
                  </SignUpButton>
                </div>
              </Show>
              <Show when="signed-in">
                <UserButton afterSignOutUrl="/" />
              </Show>
            </nav>
          </header>
          <main className="flex-1">
            {children}
          </main>
        </ClerkProvider>
      </body>
    </html>
  );
}
