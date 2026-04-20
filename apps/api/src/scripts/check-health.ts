/**
 * © 2026 Rexeat - Todos los derechos reservados.
 * Health Check Script - Validates infrastructure connectivity.
 */
import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { db, organizations } from "@rexeat/db";
import { TranslationService } from "../lib/translation";
import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3";

// ESM __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from workspace root
dotenv.config({ path: path.join(__dirname, "../../../../.env") });

async function checkHealth() {
  /* eslint-disable no-console */
  console.log("🚀 Iniciando Rexeat Full Health Check (API Layer)...\n");

  // 1. Check Turso (Database)
  try {
    await db.select().from(organizations).limit(1);
    console.log("✅ TURSO: Conexión establecida correctamente.");
  } catch (e) {
    console.error("❌ TURSO: Error de conexión:", e);
  }

  // 2. Check AI & Translation Config
  const aiConfig = {
    openRouterApiKey: process.env["OPENROUTER_API_KEY"] || "",
    deeplApiKey: process.env["DEEPL_API_KEY"] || "",
    r2AccountId: process.env["R2_ACCOUNT_ID"] || "",
    r2AccessKeyId: process.env["R2_ACCESS_KEY_ID"] || "",
    r2SecretAccessKey: process.env["R2_SECRET_ACCESS_KEY"] || "",
    r2BucketName: process.env["R2_BUCKET_NAME"] || "rexeat-assets",
  };

  const translationService = new TranslationService(aiConfig.deeplApiKey);

  try {
    if (aiConfig.deeplApiKey) {
      const translation = await translationService.translateBatch([
        "Health Check",
      ]);
      if (translation.translations[0]) {
        console.log("✅ DEEPL: Traducción funcionando.");
      }
    } else {
      console.warn("⚠️ DEEPL: API Key faltante, saltando test de traducción.");
    }
  } catch (e) {
    console.error("❌ DEEPL: Error en traducción:", (e as Error).message);
  }

  try {
    if (aiConfig.openRouterApiKey.length > 10) {
      console.log("✅ OPENROUTER: API Key detectada.");
    } else {
      console.warn("⚠️ OPENROUTER: API Key faltante o inválida.");
    }
  } catch (e) {
    console.error(
      "❌ OPENROUTER: Error de configuración:",
      (e as Error).message,
    );
  }

  // 3. Check Cloudflare R2 (Storage)
  if (aiConfig.r2AccountId) {
    const s3 = new S3Client({
      region: "auto",
      endpoint: `https://${aiConfig.r2AccountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: aiConfig.r2AccessKeyId,
        secretAccessKey: aiConfig.r2SecretAccessKey,
      },
    });

    try {
      await s3.send(new ListBucketsCommand({}));
      console.log("✅ CLOUDFLARE R2: Credenciales de acceso válidas.");
    } catch (e) {
      console.error("❌ CLOUDFLARE R2: Error de acceso:", (e as Error).message);
    }
  }

  console.log("\n🏁 Health Check completado.");
}

checkHealth().catch((err) => {
  console.error("Fatal Health Check Error:", err);
  process.exit(1);
});
