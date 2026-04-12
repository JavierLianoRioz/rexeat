# @rexeat/db

Capa de persistencia basada en **Drizzle ORM** y **SQLite**.

## 🛠️ Uso del Repositorio de Inquilino

El `TenantRepository` asegura que todas las operaciones estén aisladas por `organizationId`.

### Gestión de Stock con Auditoría

Para cambiar el estado de un producto, **nunca** uses un `update` directo si quieres mantener la trazabilidad. Usa el método transaccional:

```typescript
const repo = createTenantRepository("org_123");

await repo.updateProductStatusWithLog({
  productId: "prod_abc",
  userId: "user_789",
  newStatus: "out_of_stock",
  reason: "Rotura de stock tras servicio de comida",
});
```

Este método garantiza:

1. **Atomicidad:** O se cambia el stock y se crea el log, o no se hace nada.
2. **Integridad:** Valida automáticamente que el producto pertenece a la organización.
3. **Sincronía:** Optimizado para el driver `better-sqlite3`.

## 🧪 Tests

Ejecutar tests de auditoría:

```bash
npx tsx src/test-stock-audit.ts
```
