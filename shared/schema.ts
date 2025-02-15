import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define presets for common social media formats
export const SOCIAL_PRESETS = {
  YOUTUBE_THUMBNAIL: { width: 1280, height: 720, label: "YouTube Thumbnail" },
  INSTAGRAM_SQUARE: { width: 1080, height: 1080, label: "Instagram Square" },
  INSTAGRAM_STORY: { width: 1080, height: 1920, label: "Instagram Story" },
  TWITTER_POST: { width: 1200, height: 675, label: "Twitter Post" },
  FACEBOOK_POST: { width: 1200, height: 630, label: "Facebook Post" }
} as const;

export type SocialPreset = keyof typeof SOCIAL_PRESETS;

// Define types for editable elements
export interface EditableElement {
  id: string;
  type: 'text' | 'image';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  fontSize?: number;
  fontFamily?: string;
}

// Store processed images
export const images = pgTable("images", {
  id: serial("id").primaryKey(),
  originalName: text("original_name").notNull(),
  processedUrl: text("processed_url").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  elements: text("elements").notNull(), // JSON string of EditableElement[]
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
    "FACEBOOK_POST"
  ])
});

export type ProcessImageInput = z.infer<typeof processImageSchema>;