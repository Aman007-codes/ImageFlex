import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define presets for common social media formats
export const SOCIAL_PRESETS = {
  YOUTUBE_THUMBNAIL: { width: 1280, height: 720, label: "YouTube Thumbnail" },
  INSTAGRAM_SQUARE: { width: 1080, height: 1080, label: "Instagram Square" },
  INSTAGRAM_STORY: { width: 1080, height: 1920, label: "Instagram Story" },
  TWITTER_POST: { width: 1200, height: 675, label: "Twitter Post" },
  FACEBOOK_POST: { width: 1200, height: 630, label: "Facebook Post" },
  CUSTOM: { width: 0, height: 0, label: "Custom Size" }
} as const;

export type SocialPreset = keyof typeof SOCIAL_PRESETS;

// Custom size schema
export const customSizeSchema = z.object({
  width: z.number().min(50).max(4096),
  height: z.number().min(50).max(4096)
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

export const processImageSchema = z.object({
  file: z.instanceof(File),
  preset: z.enum([
    "YOUTUBE_THUMBNAIL",
    "INSTAGRAM_SQUARE", 
    "INSTAGRAM_STORY",
    "TWITTER_POST",
    "FACEBOOK_POST",
    "CUSTOM"
  ]),
  customSize: customSizeSchema.optional()
});

export type ProcessImageInput = z.infer<typeof processImageSchema>;