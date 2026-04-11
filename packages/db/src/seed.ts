import { db } from "./index";
import {
  organizations,
  locals,
  zones,
  products,
  categories,
  productsToCategories,
} from "./schema";
import { Money, type Allergen } from "@rexeat/types";
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

async function cleanupDatabase() {
  await db.delete(productsToCategories);
  await db.delete(categories);
  await db.delete(products);
  await db.delete(zones);
  await db.delete(locals);
  await db.delete(organizations);
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
  const zonesToCreate = ["Terraza", "Salón Principal", "Barra", "VIP"];
  for (const name of zonesToCreate) {
    await db.insert(zones).values({
      id: faker.string.uuid(),
      localId,
      organizationId: orgId,
      name,
      nfcToken: faker.string.alphanumeric(10),
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

    const allergens: Record<string, boolean> = {};
    faker.helpers
      .arrayElements(ALLERGENS, faker.number.int({ min: 0, max: 3 }))
      .forEach((a) => {
        allergens[a] = true;
      });

    await db.insert(products).values({
      id,
      organizationId: orgId,
      name: { es: spDish.name, en: enDishName },
      description: { es: spDish.desc, en: enDescription },
      price: Money.fromFloat(
        faker.number.float({ min: 5, max: 45, fractionDigits: 2 }),
      ),
      allergens,
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
        .values({ productId: id, categoryId });
    }
  }
}

async function seedRestaurant(index: number) {
  const orgId = faker.string.uuid();
  const name = faker.company.name();
  const slug = `${faker.helpers.slugify(name).toLowerCase()}-${faker.string.alphanumeric(4)}`;

  console.log(`🏢 [${index + 1}/${CONFIG.RESTAURANTS}] ${name}`);

  await db.insert(organizations).values({ id: orgId, businessName: name });

  const localId = faker.string.uuid();
  await db.insert(locals).values({
    id: localId,
    organizationId: orgId,
    name: { es: name, en: `${name} International` },
    slug,
    logo: getRandomImage(200, 200),
  });

  await createZones(localId, orgId);
  const categoryIds = await createCategories(orgId);
  await createProducts(orgId, categoryIds);
}

async function main() {
  try {
    console.log("🌱 Starting seed with fixed Spanish localization...");
    await cleanupDatabase();

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
