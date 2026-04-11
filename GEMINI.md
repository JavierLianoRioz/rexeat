# Rexeat - Digital Menu System (Documentation Repository)

This repository serves as the central documentation and knowledge base for **Rexeat**, a modern digital menu platform for restaurants and vacation rentals. It leverages NFC/QR technology to provide tourists with fast, accessible, and legally compliant (allergen-aware) digital menus.

## Project Overview

Rexeat aims to replace traditional PDF menus with a native, web-based experience that is mobile-friendly and instant. Key differentiators include:
- **NFC-First Access:** Customers scan an NFC tag or QR code at their table to open the menu instantly.
- **Dynamic Allergen Filtering:** Complies with EU 1169/2011 by providing active filtering for food intolerances.
- **AI-Driven Digitization:** Uses Google Gemini to digitize paper menus and DeepL for professional-grade translations.
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
- **[Vision & Business](docs/internal/1_vision_y_negocio.md):** Market problems, NFC strategy, and business model.
- **[Architecture & Infra](docs/internal/2_arquitectura_e_infra.md):** Tech stack details and external AI integrations.
- **[APIs & Communication](docs/internal/3_apis_y_comunicacion.md):** Real-time socket communication and manager API endpoints.
- **[UX & Flows](docs/internal/4_ux_y_flujos.md):** User interface design principles and accessibility.
- **[Local Engineering](docs/internal/5_ingenieria_local.md):** Development environment, commit standards, and testing procedures.
- **[Finance & Economics](docs/internal/6_finanzas_y_economia.md):** Cost structure and revenue model.
- **[Database Schema](docs/internal/7_base_de_datos.md):** Detailed ER diagram and data isolation strategy.

## Development Conventions

- **Commits:** Follow Conventional Commits: `type(scope): description` (e.g., `feat(api): add allergen popup`).
- **Testing:** Use **Vitest** for logic validation.
- **Database:** Use **Drizzle ORM** for SQLite schema management.
- **Performance:** Target LCP (Largest Contentful Paint) of < 1.2s for the customer-facing web menu.
- **Data Safety:** Prices are always stored in **cents** as integers to avoid rounding errors.

## Usage

This directory acts as the **Source of Truth** for the project's architecture and vision. All engineering tasks should reference these documents to ensure consistency with the established multi-tenant and high-performance requirements.
