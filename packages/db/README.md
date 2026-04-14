# @rexeat/db

Capa de persistencia y lógica de dominio de Rexeat. Basada en **Drizzle ORM** y **SQLite**.

## 🚀 Uso del Repository

La forma recomendada de interactuar con la base de datos es a través del `TenantRepository`. Este asegura que todas las operaciones estén blindadas por `organizationId`.

````typescript
import { createTenantRepository } from "@rexeat/db";

const repo = createTenantRepository("org_id_123");

// Todas las operaciones filtran automáticamente por la organización
const products = await repo.getProducts();

// Mutaciones seguras
await repo.updateProductPrice("prod_abc", 1500); // 15.00€
await repo.confirmAllergens("prod_abc", { gluten: true }); // Validación humana obligatoria


### Gestión de Stock con Auditoría

Para cambiar el estado de un producto manteniendo la trazabilidad, usa el método transaccional. Este método garantiza la **atomicidad** (cambio de stock y log en una sola operación) e **integridad** (validación de propiedad):

```typescript
await repo.updateProductStatusWithLog({
    productId: "prod_abc",
    userId: "user_789",
    newStatus: "out_of_stock",
    reason: "Rotura de stock tras servicio de comida",
  });


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
| `pnpm test:audit`  | Ejecuta los tests de auditoría (`tsx src/test-stock-audit.ts`). |
| `pnpm db:generate` | Genera archivos de migración de Drizzle.          |
| `pnpm db:push`     | Sincroniza el esquema con la base de datos local. |
| `pnpm seed`        | Puebla la base de datos con datos realistas.      |
| `pnpm typecheck`   | Valida los tipos de TypeScript.                   |
````
