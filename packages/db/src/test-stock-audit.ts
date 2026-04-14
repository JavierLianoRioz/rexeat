import {
  db,
  createTenantRepository,
  organizations,
  users,
  products,
  productStockLogs,
} from "./index";
import { eq, desc } from "drizzle-orm";

async function runAuditTest() {
  console.log("🧪 Iniciando test de auditoría de stock...");

  const ORG_ID = "org_audit_test";
  const USER_ID = "user_waiter_001";
  const PRODUCT_ID = "prod_wine_001";

  try {
    // 1. Limpieza y Setup
    await db
      .delete(productStockLogs)
      .where(eq(productStockLogs.organizationId, ORG_ID));
    await db.delete(products).where(eq(products.id, PRODUCT_ID));
    await db.delete(users).where(eq(users.id, USER_ID));
    await db.delete(organizations).where(eq(organizations.id, ORG_ID));

    await db
      .insert(organizations)
      .values({ id: ORG_ID, businessName: "Audit Test Resto" });
    await db
      .insert(users)
      .values({ id: USER_ID, organizationId: ORG_ID, role: "waiter" });
    await db.insert(products).values({
      id: PRODUCT_ID,
      organizationId: ORG_ID,
      name: { es: "Vino Tinto" },
      price: 1500,
      allergens: {},
      status: "in_stock",
    });

    console.log("✅ Entorno de prueba listo.");

    // 2. Ejecutar cambio de estado con auditoría
    const repo = createTenantRepository(ORG_ID);
    console.log("🔄 Marcando producto como 'out_of_stock'...");

    await repo.updateProductStatusWithLog({
      productId: PRODUCT_ID,
      userId: USER_ID,
      newStatus: "out_of_stock",
      reason: "Se rompió la última botella",
    });

    // 3. Verificaciones
    const [updatedProduct] = await db
      .select()
      .from(products)
      .where(eq(products.id, PRODUCT_ID));
    const [latestLog] = await db
      .select()
      .from(productStockLogs)
      .where(eq(productStockLogs.productId, PRODUCT_ID))
      .orderBy(desc(productStockLogs.createdAt));

    if (updatedProduct?.status !== "out_of_stock") {
      throw new Error("❌ Error: El estado del producto no se actualizó.");
    }
    console.log("✅ Estado del producto actualizado correctamente.");

    if (!latestLog) {
      throw new Error("❌ Error: No se creó el registro de auditoría.");
    }

    console.log("🔎 Datos del log encontrado:");
    console.log(`   - De: ${latestLog.oldStatus} -> A: ${latestLog.newStatus}`);
    console.log(`   - Usuario: ${latestLog.userId}`);
    console.log(`   - Motivo: ${latestLog.reason}`);

    if (
      latestLog.oldStatus !== "in_stock" ||
      latestLog.newStatus !== "out_of_stock"
    ) {
      throw new Error("❌ Error: Los estados en el log son incorrectos.");
    }

    console.log("\n✨ TEST DE AUDITORÍA COMPLETADO CON ÉXITO.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Fallo en el test:");
    console.error(error);
    process.exit(1);
  }
}

runAuditTest();
