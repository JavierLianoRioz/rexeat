import { Hono, type Context } from "hono";
import {
  db,
  categories,
  products,
  productsToCategories,
  eq,
  locals,
  organizations,
} from "@rexeat/db";
import { type Category, type Product } from "@rexeat/db";

export const publicMenu = new Hono();

/**
 * GET /api/public/menu/:slug
 * Devuelve el menú completo de un local basado en su slug público.
 * Optimizado para LCP < 1.2s y uso de caché en el Edge.
 */
publicMenu.get("/menu/:slug", async (c: Context) => {
  const slug = c.req.param("slug");

  if (!slug) {
    return c.json({ error: { code: "BAD_REQUEST", message: "Slug is required" } }, 400);
  }

  // 1. Resolver el Local y su Organización asociada
  const result = await db
    .select({
      local: locals,
      org: organizations,
    })
    .from(locals)
    .innerJoin(organizations, eq(locals.organizationId, organizations.id))
    .where(eq(locals.slug, slug))
    .limit(1);

  const data = result[0] as any;

  if (!data) {
    return c.json(
      {
        error: {
          code: "NOT_FOUND",
          message: "El menú solicitado no existe o el slug es inválido",
        },
      },
      404,
    );
  }

  const { local, org } = data;

  // 2. Obtener Categorías y Productos con aislamiento estricto por organizationId
  const [allCategories, allProducts, allRelations] = await Promise.all([
    db
      .select()
      .from(categories)
      .where(eq(categories.organizationId, org.id))
      .orderBy(categories.order),
    db.select().from(products).where(eq(products.organizationId, org.id)),
    db.select().from(productsToCategories),
  ]);

  // 3. Construir la jerarquía del menú
  const menuCategories = allCategories.map((cat: Category) => {
    // Filtrar productos que pertenecen a esta categoría según la tabla pivot
    const categoryProductIds = allRelations
      .filter((rel: any) => rel.categoryId === cat.id)
      .map((rel: any) => rel.productId);

    const categoryProducts = allProducts
      .filter((prod: Product) => categoryProductIds.includes(prod.id))
      .map((prod: Product) => ({
        id: prod.id,
        name: prod.name,
        price: prod.price,
        allergens: prod.allergens,
        stock_status: prod.status,
        image: prod.image,
      }));

    return {
      id: cat.id,
      name: cat.name,
      order: cat.order,
      products: categoryProducts,
    };
  });

  // 4. Configuración de caché según Menu_Publico.md
  c.header("Cache-Control", "public, s-maxage=60, stale-while-revalidate=3600");

  // 5. Estructura de respuesta final estandarizada
  return c.json({
    organization: {
      id: org.id,
      name: org.businessName,
      logo: (local.logo as any)?.url || null,
      theme: {
        primary: "#1a2b3c",
      },
    },
    menu: {
      categories: menuCategories,
    },
  });
});
