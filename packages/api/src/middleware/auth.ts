import { createMiddleware } from "hono/factory";
import { getAuth } from "@hono/clerk-auth";

/**
 * Middleware para requerir autenticación de Clerk y validar la organización.
 * Inyecta el context de la organización en la petición.
 */
export const requireOrgAuth = createMiddleware(async (c, next) => {
  const auth = getAuth(c);

  if (!auth?.userId) {
    return c.json(
      {
        error: {
          code: "UNAUTHORIZED",
          message: "Se requiere autenticación para acceder a este recurso",
        },
      },
      401,
    );
  }

  const orgId = auth.orgId;

  if (!orgId) {
    return c.json(
      {
        error: {
          code: "FORBIDDEN",
          message: "El usuario debe estar asociado a una organización activa",
        },
      },
      403,
    );
  }

  // Guardamos el contexto en el estado de Hono para uso en las rutas
  c.set("jwtPayload", auth.sessionClaims);
  c.set("orgId", orgId);
  c.set("userId", auth.userId);

  return await next();
});
