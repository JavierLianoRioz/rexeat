import { Hono, type Context } from "hono";
import { eq } from "drizzle-orm";
import {
  db,
  locals,
  organizations,
  createTenantRepository,
  languageRequests,
} from "@rexeat/db";
import {
  type Category,
  type Product,
  type OrganizationId,
  i18n,
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
 * Optimizado para LCP < 1.2s y uso de analítica de idiomas.
 */
publicMenu.get("/menu/:slug", async (c: Context) => {
  const slug = c.req.param("slug");
  const requestedLang =
    c.req.query("lang") || c.req.header("Accept-Language") || "es";
  const resolvedLang = i18n.resolve(requestedLang);

  if (!slug) {
    return c.json(
      { error: { code: "BAD_REQUEST", message: "Slug is required" } },
      400,
    );
  }

  // 1. Resolver el Local primero
  const localsResult = await db
    .select()
    .from(locals)
    .where(eq(locals.slug, slug));

  const local = localsResult[0];

  if (!local) {
    return c.json(
      { error: { code: "NOT_FOUND", message: "El menú solicitado no existe" } },
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

  // 3. Registro de Analítica de Idiomas (Background Task)
  const logPromise = db.insert(languageRequests).values({
    organizationId: org.id,
    localId: local.id,
    langCode: requestedLang.substring(0, 50),
    resolvedLang,
  });

  // Hono 4.x: accessing c.executionCtx getter throws if not available
  try {
    if (c.executionCtx) {
      c.executionCtx.waitUntil(logPromise);
    } else {
      logPromise.catch(console.error);
    }
  } catch {
    // Fallback for Node.js/Bun where executionCtx getter fails
    logPromise.catch(console.error);
  }

  // 4. Obtener Menú completo optimizado
  const repo = createTenantRepository(org.id as OrganizationId);
  const fullMenu =
    (await repo.getFullMenu()) as unknown as CategoryWithProducts[];

  // 5. Mapear a la respuesta final (inyectando el idioma resuelto)
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

  c.header("Cache-Control", "public, s-maxage=60, stale-while-revalidate=3600");

  return c.json({
    organization: {
      id: org.id,
      name: org.businessName,
      logo: local.logo?.url || null,
      theme: { primary: "#1a2b3c" },
    },
    menu: {
      categories: menuCategories,
      language: resolvedLang, // Indicar al frontend qué idioma hemos resuelto
    },
  });
});
