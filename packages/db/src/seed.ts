/* eslint-disable no-console */
import { db } from "./index";
import {
  organizations,
  locals,
  zones,
  products,
  categories,
  productsToCategories,
} from "./schema";
import { Money, type Allergen, type TranslatedString } from "@rexeat/types";
import { fakerES as faker, faker as fakerEN } from "@faker-js/faker";

const ALLERGENS: Allergen[] = [
  "gluten",
  "crustaceos",
  "huevos",
  "pescado",
  "cacahuetes",
  "soja",
  "lacteos",
  "frutos_cascara",
  "apio",
  "mostaza",
  "sesamo",
  "dioxido_azufre",
  "altramuces",
  "moluscos",
];

function createAllergenMap(active: Partial<Record<Allergen, boolean>> = {}) {
  const map: Record<string, boolean> = {};
  ALLERGENS.forEach((a) => {
    map[a] = active[a] || false;
  });
  return map;
}

const CONFIG = {
  RESTAURANTS: 3,
  CATEGORIES_PER_LOCAL: 10,
  PRODUCTS_PER_LOCAL: 50,
} as const;

// Lista de platos realistas en español para compensar que Faker.food no está localizado
const SPANISH_DISHES = [
  {
    name: "Croquetas de Jamón Ibérico",
    desc: "Croquetas cremosas con jamón de bellota directamente de la dehesa.",
  },
  {
    name: "Tortilla de Patatas",
    desc: "Tortilla tradicional con cebolla elaborada con huevos camperos.",
  },
  {
    name: "Ensaladilla Rusa",
    desc: "Clásica ensalada con ventresca de atún y mayonesa casera.",
  },
  {
    name: "Pulpo a la Gallega",
    desc: "Pulpo cocido en su punto con pimentón de la Vera y aceite de oliva virgen extra.",
  },
  {
    name: "Paella Valenciana",
    desc: "Arroz tradicional con pollo, conejo y verdura de la huerta.",
  },
  {
    name: "Gamba Blanca de Huelva",
    desc: "Gambas frescas a la plancha con un toque de sal gorda.",
  },
  {
    name: "Cochinillo Asado",
    desc: "Tierno cochinillo cocinado a baja temperatura para una piel crujiente.",
  },
  {
    name: "Gazpacho Andaluz",
    desc: "Sopa fría de tomates de la huerta con pepino, pimiento y aceite de oliva.",
  },
  {
    name: "Calamares a la Romana",
    desc: "Anillas de calamar fresco rebozadas en harina de tempura.",
  },
  {
    name: "Solomillo de Ternera",
    desc: "Solomillo a la brasa con guarnición de patatas panadera.",
  },
  {
    name: "Fabada Asturiana",
    desc: "Guiso tradicional de faba asturiana con chorizo, morcilla y lacón.",
  },
  {
    name: "Patatas Bravas",
    desc: "Patatas cortadas a mano con nuestra salsa picante secreta.",
  },
  {
    name: "Salmorejo Cordobés",
    desc: "Crema fría de tomate y pan con virutas de jamón y huevo duro.",
  },
  {
    name: "Bacalao al Pil-Pil",
    desc: "Lomo de bacalao confitado con emulsión de ajos y guindilla.",
  },
  {
    name: "Albóndigas en Salsa",
    desc: "Albóndigas caseras de ternera en salsa tradicional de la abuela.",
  },
  {
    name: "Pimientos del Padrón",
    desc: "Pimientos verdes fritos, algunos pican y otros no.",
  },
  {
    name: "Carrillera de Cerdo",
    desc: "Carrilleras estofadas al vino tinto con puré de patata trufado.",
  },
  {
    name: "Tarta de Queso",
    desc: "Tarta de queso cremosa al estilo del norte con base de galleta.",
  },
  {
    name: "Arroz con Leche",
    desc: "Postre tradicional con canela y azúcar quemada.",
  },
  {
    name: "Chuleta de Cordero Lechal",
    desc: "Chuletas a la parrilla con aroma de sarmiento.",
  },
];

const CANTABRIAN_DISHES = [
  {
    name: {
      es: "Rabas de Santander",
      en: "Santander-style Fried Squid",
      fr: "Calmars frits style Santander",
    },
    desc: {
      es: "Calamares frescos rebozados y fritos, un clásico de la bahía.",
      en: "Fresh battered and fried squid, a classic from the bay.",
      fr: "Calmars frais panés et frits, un classique de la baie.",
    },
    price: 1450,
    allergens: createAllergenMap({ gluten: true, moluscos: true }),
  },
  {
    name: {
      es: "Cocido Montañés",
      en: "Cantabrian Mountain Stew",
      fr: "Ragoût de montaña cantabre",
    },
    desc: {
      es: "Guiso tradicional de alubia blanca, berza y compango de la matanza.",
      en: "Traditional stew with white beans, cabbage, and local pork meats.",
      fr: "Ragoût traditionnel de haricots blancs, chou et viandes de porc locales.",
    },
    price: 1600,
    allergens: createAllergenMap({}),
  },
  {
    name: {
      es: "Anchoas de Santoña (8 uds)",
      en: "Santoña Anchovies (8 pcs)",
      fr: "Anchois de Santoña (8 pcs)",
    },
    desc: {
      es: "Anchoas premium sobadas a mano en aceite de oliva.",
      en: "Premium hand-prepared anchovies in olive oil.",
      fr: "Anchois de première qualité préparés à la main dans l'huile d'olive.",
    },
    price: 2200,
    allergens: createAllergenMap({ pescado: true }),
  },
  {
    name: {
      es: "Almejas a la Marinera",
      en: "Clams in Marinara Sauce",
      fr: "Palourdes à la marinière",
    },
    desc: {
      es: "Almejas de Pedreña cocinadas con salsa de vino blanco y ajo.",
      en: "Pedreña clams cooked in a white wine and garlic sauce.",
      fr: "Palourdes de Pedreña cuites dans une sauce au vin blanco y à l'ail.",
    },
    price: 2400,
    allergens: createAllergenMap({ moluscos: true, gluten: true }),
  },
  {
    name: {
      es: "Sorropotún de San Vicente",
      en: "Tuna and Potato Stew",
      fr: "Ragoût de thon et pommes de terre",
    },
    desc: {
      es: "Guiso marinero de bonito del norte con patatas y pimiento.",
      en: "Seafarer's stew with Northern tuna, potatoes, and peppers.",
      fr: "Ragoût de marin au thon du Nord, pommes de terre et poivrons.",
    },
    price: 1850,
    allergens: createAllergenMap({ pescado: true }),
  },
  {
    name: {
      es: "Quesada Pasiega",
      en: "Pasiega Cheesecake",
      fr: "Gâteau au fromage Pasiega",
    },
    desc: {
      es: "Postre típico de los Valles Pasiegos con leche de vaca cuajada.",
      en: "Typical dessert from the Pasiego Valleys with curdled cow's milk.",
      fr: "Dessert typique des vallées de Pasiego à base de lait de vache caillé.",
    },
    price: 650,
    allergens: createAllergenMap({ lacteos: true, huevos: true, gluten: true }),
  },
];

async function cleanupDatabase() {
  console.log(`Using database at: ${process.env["TURSO_DATABASE_URL"] || "default local.db"}`);
  try {
    await db.delete(productsToCategories);
    await db.delete(categories);
    await db.delete(products);
    await db.delete(zones);
    await db.delete(locals);
    await db.delete(organizations);
  } catch (e) {
    console.log("Cleanup failed (likely tables don't exist), skipping...");
  }
}

function getRandomImage(width: number, height: number) {
  const id = faker.number.int({ min: 1400000000000, max: 1600000000000 });
  return {
    url: `https://images.unsplash.com/photo-${id}?w=${width}&h=${height}&fit=crop`,
    blurHash: "L6PZfSi_.AyE_3t7t7Rj4n%W9fgW",
    width,
    height,
  };
}

async function createZones(localId: string, orgId: string) {
  const zonesToCreate = [
    { name: "Terraza", slug: "terraza" },
    { name: "Salón Principal", slug: "salon" },
    { name: "Barra", slug: "barra" },
    { name: "VIP", slug: "vip" },
  ];
  for (const { name, slug } of zonesToCreate) {
    await db.insert(zones).values({
      id: faker.string.uuid(),
      localId,
      organizationId: orgId,
      name,
      slug,
    });
  }
}

async function createCategories(orgId: string) {
  const CAT_NAMES = [
    { es: "Entrantes", en: "Starters" },
    { es: "Ensaladas", en: "Salads" },
    { es: "Carnes", en: "Meats" },
    { es: "Pescados", en: "Fish" },
    { es: "Postres", en: "Desserts" },
    { es: "Bebidas", en: "Drinks" },
    { es: "Vinos", en: "Wines" },
    { es: "Sugerencias", en: "Chef's Specials" },
    { es: "Para Compartir", en: "To Share" },
    { es: "Infantil", en: "Kids Menu" },
  ];

  const categoryIds: string[] = [];
  for (let i = 0; i < CONFIG.CATEGORIES_PER_LOCAL; i++) {
    const id = faker.string.uuid();
    const name = CAT_NAMES[i % CAT_NAMES.length];
    if (!name) continue;

    await db.insert(categories).values({
      id,
      organizationId: orgId,
      name,
      order: i,
    });
    categoryIds.push(id);
  }
  return categoryIds;
}

async function createProducts(orgId: string, categoryIds: string[]) {
  for (let i = 0; i < CONFIG.PRODUCTS_PER_LOCAL; i++) {
    const id = faker.string.uuid();

    const spDish = SPANISH_DISHES[i % SPANISH_DISHES.length]!;
    const enDishName = fakerEN.food.dish();
    const enDescription = fakerEN.food.description();

    const activeAllergens: Partial<Record<Allergen, boolean>> = {};
    faker.helpers
      .arrayElements(ALLERGENS, faker.number.int({ min: 0, max: 3 }))
      .forEach((a) => {
        activeAllergens[a] = true;
      });

    await db.insert(products).values({
      id,
      organizationId: orgId,
      name: { es: spDish.name, en: enDishName },
      description: { es: spDish.desc, en: enDescription },
      price: Money.fromFloat(
        faker.number.float({ min: 5, max: 45, fractionDigits: 2 }),
      ),
      allergens: createAllergenMap(activeAllergens),
      allergensConfirmed: true,
      status: "in_stock",
      image: getRandomImage(800, 600),
    });

    const chosenCategories = faker.helpers.arrayElements(
      categoryIds,
      faker.number.int({ min: 1, max: 2 }),
    );
    for (const categoryId of chosenCategories) {
      await db
        .insert(productsToCategories)
        .values({ productId: id, categoryId, organizationId: orgId });
    }
  }
}

async function createLocalBase(
  orgId: string,
  name: string | TranslatedString,
  slug: string,
) {
  const localId = faker.string.uuid();
  const localizedName =
    typeof name === "string" ? { es: name, en: `${name} International` } : name;

  await db.insert(locals).values({
    id: localId,
    organizationId: orgId,
    name: localizedName,
    slug,
    logo: getRandomImage(200, 200),
  });

  await createZones(localId, orgId);
  return localId;
}

async function createOrgAndLocal(name: string, slug?: string) {
  const orgId = faker.string.uuid();
  const finalSlug =
    slug ||
    `${faker.helpers.slugify(name).toLowerCase()}-${faker.string.alphanumeric(4)}`;

  await db.insert(organizations).values({ id: orgId, businessName: name });
  const localId = await createLocalBase(orgId, name, finalSlug);

  return { orgId, localId };
}

async function seedRestaurant(index: number) {
  const name = faker.company.name();
  console.log(`🏢 [${index + 1}/${CONFIG.RESTAURANTS}] ${name}`);

  const { orgId } = await createOrgAndLocal(name);
  const categoryIds = await createCategories(orgId);
  await createProducts(orgId, categoryIds);
}

async function seedCantabrianRestaurant() {
  const name = "La Taberna del Puerto";
  console.log(`⚓ [ESPECIAL] ${name} (Cantabria)`);

  const { orgId } = await createOrgAndLocal(name, "taberna-puerto");

  const categoryTemplates = [
    { es: "Entrantes", en: "Starters", fr: "Entrées" },
    { es: "Platos Principales", en: "Main Courses", fr: "Plats Principaux" },
    { es: "Postres", en: "Desserts", fr: "Desserts" },
  ];

  const categoryIds: string[] = [];
  for (let i = 0; i < categoryTemplates.length; i++) {
    const id = faker.string.uuid();
    await db.insert(categories).values({
      id,
      organizationId: orgId,
      name: categoryTemplates[i]!,
      order: i,
    });
    categoryIds.push(id);
  }

  for (const dish of CANTABRIAN_DISHES) {
    const id = faker.string.uuid();
    await db.insert(products).values({
      id,
      organizationId: orgId,
      name: dish.name,
      description: dish.desc,
      price: dish.price,
      allergens: dish.allergens,
      allergensConfirmed: true,
      status: "in_stock",
      image: getRandomImage(800, 600),
    });

    let catId = categoryIds[1]!;
    if (dish.name.es.includes("Rabas") || dish.name.es.includes("Anchoas"))
      catId = categoryIds[0]!;
    if (dish.name.es.includes("Quesada")) catId = categoryIds[2]!;

    await db
      .insert(productsToCategories)
      .values({ productId: id, categoryId: catId, organizationId: orgId });
  }
}

async function main() {
  try {
    console.log("🌱 Starting seed with fixed Spanish localization...");
    await cleanupDatabase();

    await seedCantabrianRestaurant();

    for (let i = 0; i < CONFIG.RESTAURANTS; i++) {
      await seedRestaurant(i);
    }

    console.log("\n✅ Seed completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

main();
