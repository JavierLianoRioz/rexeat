---
# Rexeat - Digital Menu System (Documentation Repository)

This repository serves as the central documentation and knowledge base for **Rexeat**, a modern digital menu platform for restaurants and vacation rentals. It leverages NFC/QR technology to provide tourists with fast, accessible, and legally compliant (allergen-aware) digital menus.

## Project Overview

Rexeat aims to replace traditional PDF menus with a native, web-based experience that is mobile-friendly and instant. Key differentiators include:
- **NFC-First Access:** Customers scan an NFC tag or QR code at their table to open the menu instantly.
- **Dynamic Allergen Filtering:** Provides active visual filtering for food intolerances based on **manual input** from the restaurant (EU 1169/2011 compliant interface).
- **AI-Driven Digitization:** Uses Google Gemini to digitize paper menu names and prices; algergen data is strictly manual-only.
- **Real-Time Stock Management:** Managers can mark items as "Out of Stock" instantly across all customer devices.

## Technical Stack & Architecture

- **Frontend:** React Native (Monorepo using Turborepo) for both Web and Mobile (iOS/Android) platforms.
- **Backend:** Node.js running on Vercel Edge Runtime.
- **Database:** Multi-tenant SQLite silos using Turso (Drizzle ORM).
- **Storage:** Cloudflare R2 for high-performance, low-cost image hosting.
- **Authentication:** Clerk (with a focus on Passkeys/Biometric login for managers).
- **Security:** Cloudflare Bot Fight Mode and Vercel Firewall to protect against scraping.

## Key Documentation Files

The core project specifications are located in `docs/internal/`:
- **[Bóveda del Proyecto](docs/internal/README.md)**: Dashboard central y navegación.
- **[Visión y Negocio](docs/internal/Vision.md)**: Problemas del mercado, estrategia NFC y modelo de negocio.
- **[Arquitectura e Infra](docs/internal/Infraestructura.md)**: Detalles del tech stack e integraciones de IA externas.
- **[APIs y Comunicación](docs/internal/APIs.md)**: Comunicación por sockets en tiempo real y endpoints de administrador.
- **[UX y Flujos](docs/internal/Diseño.md)**: Principios de diseño de interfaz y accesibilidad.
- **[Ingeniería Local](docs/internal/Ingenieria.md)**: Entorno de desarrollo, estándares de commit y procedimientos de prueba.
- **[Finanzas y Economía](docs/internal/Finanzas.md)**: Estructura de costos y modelo de ingresos.
- **[Base de Datos](docs/internal/BaseDeDatos.md)**: Diagrama ER detallado y estrategia de aislamiento de datos.
- **[Análisis Estratégico](docs/internal/Analisis_Estrategico.md)**: Análisis PESTEL y OKRs de la fase de lanzamiento.

## Development Conventions

- **Commits:** Follow Conventional Commits: `type(scope): description` (e.g., `feat(api): add allergen popup`).
- **Testing:** Use **Vitest** for logic validation.
- **Database:** Use **Drizzle ORM** for SQLite schema management.
- **Performance:** Target LCP (Largest Contentful Paint) of < 1.2s for the customer-facing web menu.
- **Data Safety:** Prices are always stored in **cents** as integers to avoid rounding errors.

## Usage

This directory acts as the **Source of Truth** for the project's architecture and vision. All engineering tasks should reference these documents to ensure consistency with the established multi-tenant and high-performance requirements.
