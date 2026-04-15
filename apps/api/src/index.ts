/**
 * © 2026 Rexeat - Todos los derechos reservados.
 * Este archivo está protegido bajo la licencia Polyform Non-Commercial 1.0.0.
 */
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { version } from "@rexeat/db";
import type { PublicMenuResponse } from "@rexeat/types";

/**
 * Rexeat API - High-performance Edge Backend
 */
const app = new Hono().basePath("/api");

// --- Middlewares ---
app.use("*", logger());
app.use("*", cors());

// --- Health Check ---
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    uptime: process.uptime(),
    db_version: version,
    runtime: "edge",
  });
});

// --- Public Routes (Customer Facing) ---

/**
 * Fetch the public menu for a specific restaurant (tenant) by slug.
 */
app.get("/menu/:slug", (c) => {
  const slug = c.req.param("slug");

  // Placeholder logic for now
  const response: PublicMenuResponse = {
    tenant: {
      name: `Restaurant ${slug.toUpperCase()}`,
      primaryColor: "#E63946",
      accentColor: "#F1FAEE",
    },
    menu: {
      id: "menu_1",
      name: "Main Menu",
      isActive: true,
      description: "Welcome to our menu",
      categories: [
        {
          id: "cat_1",
          menuId: "menu_1",
          name: "Starters",
          order: 1,
          items: [
            {
              id: "item_1",
              categoryId: "cat_1",
              name: "Classic Salad",
              price: 850, // 8.50 EUR
              allergens: ["milk"],
              isAvailable: true,
              isVegetarian: true,
              isVegan: false,
              isGlutenFree: true,
            },
          ],
        },
      ],
    },
  };

  return c.json(response);
});

// --- Admin Routes (Internal) ---

app.get("/admin", (c) => {
  return c.json({
    message: "Admin endpoints protected by Clerk session (WIP)",
  });
});

// --- Finalize ---

export default app;
