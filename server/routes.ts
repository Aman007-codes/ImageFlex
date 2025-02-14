import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { processImageSchema } from "@shared/schema";

export async function registerRoutes(app: Express) {
  // Image processing happens client-side
  // Backend just stores processed image info if needed
  
  app.post("/api/images", async (req, res) => {
    try {
      const image = await storage.createImage(req.body);
      res.json(image);
    } catch (error) {
      res.status(400).json({ error: "Failed to store image info" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
