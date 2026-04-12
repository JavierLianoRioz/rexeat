import * as dotenv from "dotenv";
import path from "path";
// Cargar .env de la raíz
dotenv.config({ path: path.join(__dirname, "../../../.env") });

import { db, organizations } from "./index";
import { AIClient } from "../../../apps/api/src/lib/ai";
import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3";

async function checkHealth() {
  console.log("🚀 Iniciando Rexeat Full Health Check...\n");

  // 1. Check Turso
  try {
    await db.select().from(organizations).limit(1);
    console.log("✅ TURSO: Conexión establecida correctamente.");
  } catch (e) {
    console.error("❌ TURSO: Error de conexión:", e);
  }

  // 2. Check Gemini & DeepL (AIClient)
  const aiConfig = {
    geminiApiKey: process.env["GEMINI_API_KEY"] || "",
    deeplApiKey: process.env["DEEPL_API_KEY"] || "",
    r2AccountId: process.env["R2_ACCOUNT_ID"] || "",
    r2AccessKeyId: process.env["R2_ACCESS_KEY_ID"] || "",
    r2SecretAccessKey: process.env["R2_SECRET_ACCESS_KEY"] || "",
    r2BucketName: process.env["R2_BUCKET_NAME"] || "rexeat-assets",
  };

  const aiClient = new AIClient(aiConfig);

  try {
    const translation = await aiClient.translateText("Hola mundo", "es");
    if (translation.en) {
      console.log("✅ DEEPL: Traducción funcionando (ES -> EN).");
    }
  } catch (e) {
    console.error("❌ DEEPL: Error en traducción (Revisa si tu key termina en :fx):", (e as Error).message);
  }

  try {
    if (aiConfig.geminiApiKey.startsWith("AIza")) {
      console.log("✅ GEMINI: API Key detectada con formato válido.");
    } else {
      throw new Error("Formato de API Key inválido (Debe empezar por AIza)");
    }
  } catch (e) {
    console.error("❌ GEMINI: Error de configuración:", (e as Error).message);
  }

  // 3. Check Cloudflare R2
  if (aiConfig.r2AccountId) {
    const s3 = new S3Client({
      region: "auto",
      endpoint: `https://${aiConfig.r2AccountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: aiConfig.r2AccessKeyId,
        secretAccessKey: aiConfig.r2SecretAccessKey,
      },
      forcePathStyle: true,
    });

    try {
      await s3.send(new ListBucketsCommand({}));
      console.log("✅ CLOUDFLARE R2: Credenciales de acceso válidas.");
    } catch (e) {
      console.error("❌ CLOUDFLARE R2: Error de acceso:", (e as Error).message);
    }
  } else {
    console.error("❌ CLOUDFLARE R2: R2_ACCOUNT_ID no configurado.");
  }

  console.log("\n🏁 Check completado.");
}

checkHealth().catch(console.error);
