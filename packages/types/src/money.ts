import { z } from "zod";

export const CentsSchema = z.number().int().nonnegative();
export type Cents = z.infer<typeof CentsSchema>;

const currencyFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

export const Money = {
  fromFloat(val: number): Cents {
    return Math.round(val * 100);
  },

  toFloat(val: Cents): number {
    return val / 100;
  },

  toDisplay(val: Cents): string {
    return currencyFormatter.format(val / 100);
  },
} as const;
