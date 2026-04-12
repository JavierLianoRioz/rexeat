# @rexeat/db

Capa de persistencia y lógica de dominio de Rexeat. Basada en **Drizzle ORM** and **SQLite**.

## 🚀 Uso del Repository

La forma recomendada de interactuar con la base de datos es a través del `TenantRepository`. Este asegura que todas las operaciones estén blindadas por `organizationId`.

```typescript
import { createTenantRepository } from "@rexeat/db";

const repo = createTenantRepository("org_id_123");

// Todas las operaciones filtran automáticamente por la organización
const products = await repo.getProducts();

// Mutaciones seguras
await repo.updateProductPrice("prod_abc", 1500); // 15.00€
await repo.toggleProductStatus("prod_abc");
await repo.confirmAllergens("prod_abc", { gluten: true }); // Validación humana obligatoria
```

## 🛡️ Seguridad Multi-Tenant

- **Índices:** Todas las tablas de dominio están indexadas por `organization_id` para máximo rendimiento.
- **Validación de Propiedad:** El repositorio verifica la propiedad de los recursos antes de realizar cambios.

## 🥗 Seguridad Alimentaria

- **Confirmación de Alérgenos:** Ningún producto es apto para filtrado si `allergensConfirmed` es `false`.
- **Uso:** `repo.confirmAllergens(id, map)` marca el producto como verificado por un humano.

## 🛠️ Scripts

| Comando            | Descripción                                       |
| ------------------ | ------------------------------------------------- |
| `pnpm test`        | Ejecuta la suite de pruebas con Vitest.           |
| `pnpm db:generate` | Genera archivos de migración de Drizzle.          |
| `pnpm db:push`     | Sincroniza el esquema con la base de datos local. |
| `pnpm seed`        | Puebla la base de datos con datos realistas.      |
| `pnpm typecheck`   | Valida los tipos de TypeScript.                   |
