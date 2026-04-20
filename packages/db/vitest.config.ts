/**
 * © 2026 Rexeat - Todos los derechos reservados.
 */
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
      include: ["src/index.ts", "src/schema.ts"],
      exclude: ["src/test-*.ts", "src/seed.ts"],
    },
  },
});
