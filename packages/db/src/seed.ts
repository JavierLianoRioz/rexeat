import { db } from "./index";
import {
  organizations,
  locals,
  zones,
  tables,
  products,
  categories,
  productsToCategories,
} from "./schema";
import { Money } from "@rexeat/types";

async function main() {
  console.log("🌱 Iniciando siembra de datos (Seed)...");

  // 1. Crear Organización (Silo)
  const orgId = "org_cantabria_001";
  await db
    .insert(organizations)
    .values({
      id: orgId,
      businessName: "Grupo Gastronómico Cantabria",
    })
    .onConflictDoNothing();

  // 2. Crear Local
  const localId = crypto.randomUUID();
  await db.insert(locals).values({
    id: localId,
    organizationId: orgId,
    name: { es: "La Taberna del Puerto", en: "The Port Tavern" },
    slug: "la-taberna-del-puerto",
  });

  // 3. Crear Zonas y Mesas
  const zoneId = crypto.randomUUID();
  await db.insert(zones).values({
    id: zoneId,
    localId,
    organizationId: orgId,
    name: "Terraza",
  });

  await db.insert(tables).values({
    id: crypto.randomUUID(),
    zoneId,
    localId,
    organizationId: orgId,
    number: "Mesa 1",
    nfcToken: "nfc_test_001",
  });

  // 4. Crear Categorías
  const catEntrantesId = crypto.randomUUID();
  await db.insert(categories).values({
    id: catEntrantesId,
    organizationId: orgId,
    name: { es: "Entrantes", en: "Starters" },
    order: 1,
  });

  // 5. Crear Productos
  const prodRabasId = crypto.randomUUID();
  await db.insert(products).values({
    id: prodRabasId,
    organizationId: orgId,
    name: { es: "Rabas de Cantabria", en: "Cantabrian Fried Squid" },
    description: {
      es: "Rabas frescas de la bahía con un toque de limón.",
      en: "Fresh squid from the bay.",
    },
    price: Money.fromFloat(14.5), // 1450 céntimos
    allergens: { gluten: true, moluscos: true },
    status: "in_stock",
  });

  // 6. Relacionar N:M
  await db.insert(productsToCategories).values({
    productId: prodRabasId,
    categoryId: catEntrantesId,
  });

  console.log("✅ Siembra completada con éxito.");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error en el seed:", err);
  process.exit(1);
});
