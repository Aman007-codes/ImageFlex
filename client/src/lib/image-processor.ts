import imageCompression from "browser-image-compression";
import { ProcessImageInput, SOCIAL_PRESETS } from "@shared/schema";

export async function processImage({ file, preset }: ProcessImageInput): Promise<string> {
  const targetSize = SOCIAL_PRESETS[preset];
  
  // Compress image before processing
  const compressedFile = await imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: Math.max(targetSize.width, targetSize.height),
  });

  // Create canvas for resizing
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  // Set canvas size to target dimensions
  canvas.width = targetSize.width;
  canvas.height = targetSize.height;

  // Create image element to draw from
  const img = new Image();
  img.src = URL.createObjectURL(compressedFile);
  
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });

  // Calculate scaling and positioning to preserve content
  const scale = Math.max(
    targetSize.width / img.width,
    targetSize.height / img.height
  );
  
  const scaledWidth = img.width * scale;
  const scaledHeight = img.height * scale;
  const x = (targetSize.width - scaledWidth) / 2;
  const y = (targetSize.height - scaledHeight) / 2;

  // Draw image with content preservation
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

  // Convert to data URL
  return canvas.toDataURL("image/jpeg", 0.9);
}
