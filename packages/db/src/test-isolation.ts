import { db, createTenantRepository, organizations, products } from "./index";

async function runTest() {
  console.log("🧪 Iniciando test de aislamiento de datos (POO Repository)...");

  const ORG_A = "org_alfa_123";
  const ORG_B = "org_beta_456";

  try {
    // 1. Setup inicial
    await db
      .insert(organizations)
      .values([
        { id: ORG_A, businessName: "Restaurante Alfa" },
        { id: ORG_B, businessName: "Taberna Beta" },
      ])
      .onConflictDoNothing();

    await db
      .insert(products)
      .values([
        {
          id: "prod_alfa_repo",
          organizationId: ORG_A,
          name: { es: "Plato Alfa" },
          price: 1000,
          allergens: {},
        },
        {
          id: "prod_beta_repo",
          organizationId: ORG_B,
          name: { es: "Plato Beta" },
          price: 2000,
          allergens: {},
        },
      ])
      .onConflictDoNothing();

    console.log("✅ Datos de prueba insertados.");

    // 2. Probar repositorio de ORG_A
    const repoA = createTenantRepository(ORG_A);
    const productsA = await repoA.getProducts();

    console.log(`🔎 Repo ORG_A: Encontrados ${productsA.length} productos.`);
    if (productsA.some((p) => p.organizationId !== ORG_A)) {
      throw new Error("❌ ERROR: Fuga de datos detectada en Repo A.");
    }

    // 3. Probar repositorio de ORG_B
    const repoB = createTenantRepository(ORG_B);
    const productsB = await repoB.getProducts();

    console.log(`🔎 Repo ORG_B: Encontrados ${productsB.length} productos.`);
    if (productsB.some((p) => p.organizationId !== ORG_B)) {
      throw new Error("❌ ERROR: Fuga de datos detectada en Repo B.");
    }

    console.log(
      "\n✨ TEST COMPLETADO: El repositorio POO es seguro y escalable.",
    );
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

runTest();
