import { defineConfig } from "drizzle-kit";
import path from "node:path";

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: `file:${path.resolve(__dirname, "../../rexeat_final.db")}`,
  },
});
