/**
 * © 2026 Rexeat - Todos los derechos reservados.
 */
import { beforeAll, afterAll } from "vitest";
import { createClient, createDb } from "@rexeat/db";
import { unlinkSync, existsSync } from "fs";

// Entorno de test
process.env["CLERK_WEBHOOK_SECRET"] = "whsec_test_secret";
process.env["TURSO_DATABASE_URL"] = "file:test.db";

const _client = createClient({ url: "file:test.db" });
createDb("file:test.db");

beforeAll(async () => {
  // Limpiar base de datos previa si existe
  if (existsSync("test.db")) {
    // unlinkSync("test.db");
  }
});

afterAll(async () => {
  _client.close();
  if (existsSync("test.db")) {
    unlinkSync("test.db");
  }
});
