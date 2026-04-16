/**
 * © 2026 Rexeat - Diagnóstico de Conectividad IA (OpenRouter Edition)
 */
import dotenv from "dotenv";

dotenv.config({ path: "../../.env" });

async function testOpenRouter() {
  /* eslint-disable no-console */
  console.log("🔍 Probando OpenRouter...");
  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env["OPENROUTER_API_KEY"]}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-flash-1.5",
          messages: [{ role: "user", content: "Hola, responde solo 'OK'" }],
        }),
      },
    );
    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    console.log(
      "✅ OpenRouter:",
      data.choices?.[0]?.message?.content || "Sin respuesta",
    );
  } catch (e) {
    console.error("❌ OpenRouter falló:", e);
  }
}

async function testDeepL() {
  console.log("\n🔍 Probando DeepL...");
  try {
    const response = await fetch("https://api-free.deepl.com/v2/usage", {
      headers: {
        Authorization: `DeepL-Auth-Key ${process.env["DEEPL_API_KEY"]}`,
      },
    });
    if (response.ok) {
      console.log("✅ DeepL: Conexión exitosa");
    } else {
      console.log("❌ DeepL:", await response.text());
    }
  } catch (e) {
    console.error("❌ DeepL falló:", e);
  }
}

async function run() {
  await testOpenRouter();
  await testDeepL();
}

run();
