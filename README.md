# Rexeat - Monorepo Universal

Bienvenido a la arquitectura central de **Rexeat**, un sistema de menú digital diseñado para el máximo rendimiento y consistencia universal.

## Estructura del Proyecto

### 🚀 Aplicaciones (`apps/`)
- **`web/`**: Menú digital del cliente (Next.js + React Native Web). SSR/ISR con objetivo LCP < 1.2s.
- **`mobile/`**: App de gestión nativa para el local (Expo/React Native).
- **`api/`**: Endpoints de IA (Gemini/DeepL) y autenticación (Clerk). Vercel Edge Runtime.

### 📦 Paquetes Compartidos (`packages/`)
- **`db/`**: Esquema de Drizzle ORM (Turso/SQLite local).
- **`ui/`**: Componentes visuales universales (primitivas nativas).
- **`types/`**: Definiciones globales de TypeScript (Precios en céntimos, Alérgenos).
- **`configs/`**: Reglas compartidas de ESLint, Prettier y TSConfig.

## Guía de Desarrollo Rápido

### Comandos de Orquestación (pnpm + turbo)
- `pnpm install`: Instala y enlaza todas las dependencias.
- `pnpm dev`: Inicia todo el entorno de desarrollo en paralelo.
- `pnpm build`: Compila las aplicaciones respetando el grafo de dependencias.
- `pnpm lint`: Verifica la calidad del código en todo el monorepo.

### Estrategia de DX y Worktrees
Para trabajar en tareas paralelas sin conflictos:
`git worktree add ../rexeat-task-name feat/branch-name`
