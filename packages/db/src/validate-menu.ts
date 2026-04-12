/* eslint-disable no-console */
import { db } from "./index";
import { products } from "./schema";

const MIN_DESCRIPTION_LENGTH = 5;

function checkProductIntegrity(
  product: typeof products.$inferSelect,
): string[] {
  const { id, name, description } = product;
  const issues: string[] = [];

  // 1. Validar Nombre
  if (!name.en?.trim()) {
    issues.push(
      `❌ Producto [${id}]: Falta nombre en Inglés (ES: "${name.es}")`,
    );
  }

  // 2. Validar Existencia de Descripción
  if (!description) {
    issues.push(`⚠️ Producto [${id}]: Falta descripción (ES: "${name.es}")`);
    return issues;
  }

  // 3. Validar Contenido de Descripción
  if (!description.en?.trim()) {
    issues.push(
      `❌ Producto [${id}]: Falta descripción en Inglés (ES: "${name.es}")`,
    );
  }

  if (description.es.trim().length < MIN_DESCRIPTION_LENGTH) {
    issues.push(
      `⚠️ Producto [${id}]: Descripción ES demasiado corta ("${description.es}")`,
    );
  }

  return issues;
}

async function validateMenu() {
  console.log("🔍 Escaneando integridad del menú...");

  const allProducts = await db.select().from(products);
  const allIssues = allProducts.flatMap(checkProductIntegrity);

  if (allIssues.length === 0) {
    console.log("\n✅ Integridad de menú perfecta.");
    process.exit(0);
  }

  console.log(`\n🚨 Se encontraron ${allIssues.length} problemas:\n`);
  allIssues.forEach((issue: string) => console.log(issue));
  process.exit(1);
}

validateMenu().catch((err) => {
  console.error("Error validando el menú:", err);
  process.exit(1);
});
