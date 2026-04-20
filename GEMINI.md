---

# Rexeat - Digital Menu System (Documentation Repository)

This repository serves as the central documentation and knowledge base for **Rexeat**, a modern digital menu platform for restaurants and vacation rentals. It leverages NFC/QR technology to provide tourists with fast, accessible, and legally compliant (allergen-aware) digital menus.

## Project Overview

Rexeat aims to replace traditional PDF menus with a native, web-based experience that is mobile-friendly and instant. Key differentiators include:

- **NFC-First Access:** Customers scan an NFC tag or QR code at their table to open the menu instantly.
- **Dynamic Allergen Filtering:** Provides active visual filtering for food intolerances based on **manual input** from the restaurant (EU 1169/2011 compliant interface).
- **AI-Driven Digitization:** Uses OpenRouter to digitize paper menu names and prices; algergen data is strictly manual-only.
- **Real-Time Stock Management:** Managers can mark items as "Out of Stock" instantly across all customer devices.

## Technical Stack & Architecture

- **Frontend:** React Native (Monorepo using Turborepo) for both Web and Mobile (iOS/Android) platforms.
- **Backend:** Node.js running on Vercel Edge Runtime.
- **Database:** Multi-tenant Shared Schema (Row-Level Security) using Turso (Drizzle ORM).
- **Storage:** Cloudflare R2 for high-performance, low-cost image hosting.
- **Authentication:** Clerk (with a focus on Passkeys/Biometric login for managers).
- **Security:** Cloudflare Bot Fight Mode and Vercel Firewall to protect against scraping.

## Key Documentation Files (Atomic Vault v2.0)

The documentation is organized into 5 specialized pillars within `docs/internal/`:

1. **[Producto y Diseño (00)](./docs/internal/00_Producto_y_Diseno/):** Visión, UX, flujos y sistema de diseño.
2. **[Arquitectura y Sistemas (01)](./docs/internal/01_Arquitectura_y_Sistemas/):** Infraestructura Edge, modelos de datos, APIs y resiliencia.
3. **[Ingeniería y Desarrollo (02)](./docs/internal/02_Ingenieria_y_Desarrollo/):** DX, estándares de código, testing y gestión de monorepo.
4. **[Operaciones y Hardware (03)](./docs/internal/03_Operaciones_y_Hardware/):** Despliegue de hardware NFC y onboarding de locales.
5. **[Negocio y Estrategia (04)](./docs/internal/04_Negocio_y_Estrategia/):** Finanzas, GTM, legalidad y tracking de progreso.

_See the [Master Portal (README.md)](docs/internal/README.md) for full navigation._

## Development Conventions

- **Commits:** Follow Conventional Commits: `type(scope): description`.
- **Testing:** Use **Vitest** for logic validation.
- **Database:** Use **Drizzle ORM** for SQLite schema management.
- **Performance:** Target LCP (Largest Contentful Paint) of < 1.2s for the customer-facing web menu.
- **Data Safety:** Prices are always stored in **cents** as integers.

## AI Agent Memory & Guidelines

To ensure consistency and high quality, the AI assistant MUST strictly follow the specialized skills defined in this repository. Before and during tasks, the agent should consult these references:

- **Documentation Standards**: [Documentation Templates](.agents/skills/documentation-templates/SKILL.md) — MUST follow the Atomic Vault structure and API flow templates.
- **Legal & Compliance**: MUST ensure all new core files include the copyright notice. Allergen information is always **manual-only** (Support tool focus).
- **Coding Quality**: [Clean Code](.agents/skills/clean-code/SKILL.md) & [Best Practices](.agents/skills/best-practices/SKILL.md)
- **Architecture**: [Monorepo](.agents/skills/monorepo-architect/SKILL.md), [Multi-tenant SaaS](.agents/skills/saas-multi-tenant/SKILL.md), & [React Native](.agents/skills/react-native-architecture/SKILL.md)
- **Database**: [Drizzle ORM Expert](.agents/skills/drizzle-orm-expert/SKILL.md)
- **Authentication**: [Clerk Auth](.agents/skills/clerk-auth/SKILL.md)

## Usage

This directory acts as the **Source of Truth**. All engineering tasks should reference these atomic documents to ensure consistency with the established multi-tenant and high-performance requirements.
