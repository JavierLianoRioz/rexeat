/**
 * © 2026 Rexeat - Todos los derechos reservados.
 * Este archivo está protegido bajo la licencia Polyform Non-Commercial 1.0.0.
 */
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import type { HonoEnv } from "../index";

/**
 * CP-01: Middleware de Aislamiento de Infraestructura (DIP Guard).
 *
 * Este middleware actúa como la última línea de defensa en el "perímetro".
 * Su misión es asegurar que NINGUNA petición a rutas protegidas pueda proceder
 * sin un organizationId blindado.
 */
export const isolationGuard = createMiddleware<HonoEnv>(async (c, next) => {
  const orgId = c.get("orgId");
  const repo = c.get("repo");

  // 1. Hard Check: El orgId DEBE existir en el contexto tras la autenticación
  if (!orgId || typeof orgId !== "string" || orgId.trim() === "") {
    console.error(
      `[ISOLATION_BREACH_ATTEMPT] Request to ${c.req.url} blocked: Missing Organization ID`,
    );

    throw new HTTPException(403, {
      message:
        "Infrastructure Guard: Tenant Isolation Failure. Missing orgId context.",
    });
  }

  // 2. Safety Check: Verificar que el repo está inicializado
  if (!repo) {
    throw new HTTPException(500, {
      message: "Infrastructure Guard: Repository not initialized.",
    });
  }

  await next();

  // 3. Post-Check: Validar que no haya habido fugas en la respuesta vía header
  const responseOrgId = c.res.headers.get("x-tenant-id");
  if (responseOrgId && responseOrgId !== orgId) {
    throw new HTTPException(500, {
      message: "Critical Isolation Breach: Tenant ID mismatch in response.",
    });
  }
});
