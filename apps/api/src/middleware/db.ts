import { createMiddleware } from "hono/factory";
import { createTenantRepository } from "@rexeat/db";
import type { HonoEnv } from "../index";

/**
 * Middleware que inyecta una instancia de TenantRepository en el contexto.
 * Debe ejecutarse DESPUÉS de un middleware de autenticación que inyecte 'orgId'.
 */
export const withTenantRepo = createMiddleware<HonoEnv>(async (c, next) => {
  const orgId = c.get("orgId");

  if (!orgId) {
    return c.json(
      {
        error: {
          code: "NOT_FOUND",
          message:
            "No se encontró el ID de organización para el aislamiento de datos",
        },
      },
      404,
    );
  }

  // Inyectamos el repositorio configurado para este inquilino
  const repo = createTenantRepository(orgId);
  c.set("repo", repo);

  return await next();
});
