import { z } from "zod";

export const StockUpdateEventSchema = z.object({
  productId: z.string().uuid(),
  status: z.enum(["AVAILABLE", "OUT_OF_STOCK"]),
  organizationId: z.string(),
});

export type StockUpdateEvent = z.infer<typeof StockUpdateEventSchema>;

export const PriceUpdateEventSchema = z.object({
  productId: z.string().uuid(),
  newPrice: z.number().int().nonnegative(),
  organizationId: z.string(),
});

export type PriceUpdateEvent = z.infer<typeof PriceUpdateEventSchema>;

export type RealtimeEvent =
  | { type: "STOCK_UPDATE"; payload: StockUpdateEvent }
  | { type: "PRICE_UPDATE"; payload: PriceUpdateEvent };
