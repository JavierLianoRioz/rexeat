import { pusher } from "../lib/pusher";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

/* eslint-disable no-console */
async function testStockUpdate() {
  console.log("🚀 Enviando evento de prueba STOCK_UPDATE...");

  const payload = {
    productId: "00000000-0000-0000-0000-000000000000",
    status: "OUT_OF_STOCK",
    organizationId: "org_test_123",
  };

  try {
    await pusher.trigger(
      `public-org-${payload.organizationId}`,
      "STOCK_UPDATE",
      payload,
    );
    console.log("✅ Evento enviado correctamente a Pusher.");
  } catch (err) {
    console.error("❌ Error al enviar evento:", err);
  }
}

testStockUpdate();
