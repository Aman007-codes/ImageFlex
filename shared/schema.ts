
import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define presets for common marketplace formats
export const SOCIAL_PRESETS = {
  UI8_LARGE: { width: 2112, height: 5000, label: "UI8 Large" },
  UI8_MEDIUM: { width: 1800, height: 1360, label: "UI8 Medium" },
  UI8_SMALL: { width: 1400, height: 600, label: "UI8 Small" },
  GUMROAD_LARGE: { width: 1280, height: 720, label: "Gumroad Large" },
  GUMROAD_SMALL: { width: 600, height: 600, label: "Gumroad Small" },
  LEMON_SQUEEZY: { width: 1652, height: 1240, label: "Lemon Squeezy" },
  FRAMER: { width: 1600, height: 1200, label: "Framer Official" },
  NOTION_LARGE: { width: 2048, height: 1280, label: "Notion Large" },
  NOTION_SMALL: { width: 750, height: 1500, label: "Notion Small" },
  CREATIVE_MARKET: { width: 1920, height: 1080, label: "Creative Market" },
  CUSTOM: { width: 0, height: 0, label: "Custom Size" }
} as const;

export type SocialPreset = keyof typeof SOCIAL_PRESETS;

// Custom size schema
export const customSizeSchema = z.object({
  width: z.number().min(50).max(5000),
  height: z.number().min(50).max(5000)
});

export type CustomSize = z.infer<typeof customSizeSchema>;

// Store processed images
export const images = pgTable("images", {
  id: serial("id").primaryKey(),
  originalName: text("original_name").notNull(),
  processedUrl: text("processed_url").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
});

export const insertImageSchema = createInsertSchema(images);
export type InsertImage = z.infer<typeof insertImageSchema>;
export type Image = typeof images.$inferSelect;
