/**
 * © 2026 Rexeat - Prueba Real de Digitalización
 */
import { getAIClient } from "../lib/ai";
import { readFileSync } from "fs";
import dotenv from "dotenv";

dotenv.config({ path: "../../.env" });

async function main() {
  /* eslint-disable no-console */
  try {
    console.log("🚀 Iniciando prueba de digitalización real...");

    const imagePath = "/home/midas/Pictures/menu";
    const imageBuffer = readFileSync(imagePath);
    const mimeType = "image/png";
    const testOrgId = "org_test_real_001";

    const aiClient = getAIClient();

    console.log(
      "📸 Procesando imagen con Gemini y traduciendo con DeepL (Batch)...",
    );
    const startTime = Date.now();

    const result = await aiClient.digitizeMenu(
      imageBuffer.buffer.slice(
        imageBuffer.byteOffset,
        imageBuffer.byteOffset + imageBuffer.byteLength,
      ),
      mimeType,
      testOrgId,
    );

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`\n✅ Digitalización completada en ${duration}s!`);
    console.log(
      `💰 Coste Estimado: ${result.usage.aiCostMillicents + result.usage.translationCostMillicents} milicéntimos`,
    );
    console.log("--------------------------------------------------");

    result.items.forEach((item, index) => {
      console.log(
        `${index + 1}. ${item.name.es} (${(item.price / 100).toFixed(2)}€)`,
      );
      console.log(`   🇺🇸 EN: ${item.name.en}`);
      console.log(`   🇫🇷 FR: ${item.name.fr}`);
      console.log(`   🇩🇪 DE: ${item.name.de}`);
      console.log("--------------------------------------------------");
    });
  } catch (error) {
    console.error("❌ Error en la prueba:", error);
  }
}

main();
