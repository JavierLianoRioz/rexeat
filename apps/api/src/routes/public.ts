import { Hono, type Context } from "hono";
import { db, locals, organizations, createTenantRepository } from "@rexeat/db";
import {
  type Category,
  type Product,
  type OrganizationId,
} from "@rexeat/types";

export const publicMenu = new Hono();

interface CategoryWithProducts extends Category {
  productsToCategories: {
    product: Product;
  }[];
}

/**
 * GET /api/public/menu/:slug
 * Devuelve el menú completo de un local basado en su slug público.
 * Optimizado para LCP < 1.2s y uso de caché en el Edge.
 */
publicMenu.get("/menu/:slug", async (c: Context) => {
  const slug = c.req.param("slug");

  if (!slug) {
    return c.json(
      { error: { code: "BAD_REQUEST", message: "Slug is required" } },
      400,
    );
  }

  // 1. Resolver el Local primero (sin join para evitar error de tipos en Edge)
  const localsResult = await db
    .select()
    .from(locals)
    .where(eq(locals.slug, slug));

  const local = localsResult[0];

  if (!local) {
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

  // 2. Obtener la Organización
  const orgsResult = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, local.organizationId));

  const org = orgsResult[0];

  if (!org) {
    return c.json(
      { error: { code: "INTERNAL_ERROR", message: "Organization not found" } },
      500,
    );
  }

  // 3. Obtener Menú completo optimizado usando el repositorio (PERF-01)
  const repo = createTenantRepository(org.id as OrganizationId);
  const fullMenu =
    (await repo.getFullMenu()) as unknown as CategoryWithProducts[];

  // 4. Mapear a la estructura de respuesta final (LCP < 1.2s)
  const menuCategories = fullMenu.map((cat) => ({
    id: cat.id,
    name: cat.name,
    order: cat.order,
    products: cat.productsToCategories
      .filter((rel) => rel.product !== null)
      .map((rel) => ({
        id: rel.product.id,
        name: rel.product.name,
        price: rel.product.price,
        allergens: rel.product.allergens,
        stock_status: rel.product.status,
        image: rel.product.image,
      })),
  }));

  // 5. Configuración de caché según Menu_Publico.md
  c.header("Cache-Control", "public, s-maxage=60, stale-while-revalidate=3600");

  // 6. Estructura de respuesta final estandarizada
  return c.json({
    organization: {
      id: org.id,
      name: org.businessName,
      logo: local.logo?.url || null,
      theme: {
        primary: "#1a2b3c",
      },
    },
    menu: {
      categories: menuCategories,
    },
  });
});
