import { GoogleGenerativeAI } from "@google/generative-ai";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { DigitizationResponseSchema } from "@rexeat/types";
import { z } from "zod";

const envSchema = z.object({
  GEMINI_API_KEY: z.string(),
  R2_ACCOUNT_ID: z.string(),
  R2_ACCESS_KEY_ID: z.string(),
  R2_SECRET_ACCESS_KEY: z.string(),
  R2_BUCKET_NAME: z.string(),
});

const env = envSchema.parse(process.env);

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

export async function digitizeMenu(imageBuffer: Buffer, contentType: string) {
  const requestId = crypto.randomUUID();
  const fileName = `uploads/${requestId}.${contentType.split("/")[1]}`;

  // 1. Upload to R2 for persistence and auditing
  await s3Client.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: fileName,
      Body: imageBuffer,
      ContentType: contentType,
    })
  );

  // 2. Process with Gemini
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" }
  });

  const prompt = `
    You are a professional menu digitizer. 
    Analyze the provided image of a restaurant menu.
    Extract the items, their names, and their prices.
    
    Rules:
    - Return the data in valid JSON format.
    - Prices must be converted to CENTS (integers).
    - If a price is "12.50", return 1250.
    - If no price is found, use null or 0.
    - Response must follow this structure: { "items": [{ "name": string, "originalPriceText": string, "parsedPrice": number, "confidence": number }], "requestId": string }
  `;

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        data: imageBuffer.toString("base64"),
        mimeType: contentType,
      },
    },
  ]);

  const responseText = result.response.text();
  const rawData = JSON.parse(responseText);
  
  // 3. Validate against shared types
  return DigitizationResponseSchema.parse({
    ...rawData,
    requestId,
  });
}
