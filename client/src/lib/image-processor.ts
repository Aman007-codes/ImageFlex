import imageCompression from "browser-image-compression";
import { ProcessImageInput, SOCIAL_PRESETS } from "@shared/schema";

function getBackgroundColor(ctx: CanvasRenderingContext2D, img: HTMLImageElement): string {
  // Sample pixels from the edges of the image to determine background color
  const edgeSize = 10;
  const samples: { r: number; g: number; b: number; }[] = [];

  // Sample from corners and edges
  const locations = [
    [0, 0], // Top-left
    [img.width - 1, 0], // Top-right
    [0, img.height - 1], // Bottom-left
    [img.width - 1, img.height - 1], // Bottom-right
    [Math.floor(img.width / 2), 0], // Top middle
    [Math.floor(img.width / 2), img.height - 1], // Bottom middle
  ];

  for (const [x, y] of locations) {
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    samples.push({ r: pixel[0], g: pixel[1], b: pixel[2] });
  }

  // Calculate average color
  const avgColor = samples.reduce(
    (acc, { r, g, b }) => ({
      r: acc.r + r / samples.length,
      g: acc.g + g / samples.length,
      b: acc.b + b / samples.length,
    }),
    { r: 0, g: 0, b: 0 }
  );

  return `rgb(${Math.round(avgColor.r)}, ${Math.round(avgColor.g)}, ${Math.round(avgColor.b)})`;
}

interface ProcessImageOptions extends ProcessImageInput {
  zoomLevel?: number; // 0.5 to 2.0, default 1.0
  customSize?: { width: number; height: number };
}

export async function processImage({ file, preset, customSize, zoomLevel = 1.0 }: ProcessImageOptions): Promise<string> {
  const targetSize = preset === "CUSTOM" && customSize 
    ? customSize 
    : SOCIAL_PRESETS[preset];

  // Compress image before processing
  const compressedFile = await imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: Math.max(targetSize.width, targetSize.height),
  });

  // Create canvas for resizing
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  // Create temporary canvas for background color detection
  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");
  if (!tempCtx) throw new Error("Could not get temporary canvas context");

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

  // Set up temporary canvas for background detection
  tempCanvas.width = img.width;
  tempCanvas.height = img.height;
  tempCtx.drawImage(img, 0, 0);

  // Detect background color
  const backgroundColor = getBackgroundColor(tempCtx, img);

  // Calculate optimal scaling while preserving aspect ratio
  let scale = Math.min(
    targetSize.width / img.width,
    targetSize.height / img.height
  );

  // If the image would be too small, scale up instead
  const minScale = Math.max(
    targetSize.width / img.width,
    targetSize.height / img.height
  );
  if (scale < 0.5) scale = minScale;

  // Apply zoom level to scale
  scale *= zoomLevel;

  // Calculate dimensions after scaling
  const scaledWidth = img.width * scale;
  const scaledHeight = img.height * scale;

  // Add padding to prevent cropping
  const x = (targetSize.width - scaledWidth) / 2;
  const y = (targetSize.height - scaledHeight) / 2;

  // Fill background with detected color
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw image with smart positioning based on format
  if (preset === "INSTAGRAM_STORY") {
    ctx.drawImage(
      img,
      x,
      y * 0.5, // Align more towards top for vertical formats
      scaledWidth,
      scaledHeight
    );
  } else if (preset === "YOUTUBE_THUMBNAIL") {
    ctx.drawImage(
      img,
      x,
      y * 0.8, // Slightly higher than center
      scaledWidth,
      scaledHeight
    );
  } else {
    ctx.drawImage(
      img,
      x,
      y,
      scaledWidth,
      scaledHeight
    );
  }

  // Convert to data URL with high quality
  return canvas.toDataURL("image/jpeg", 0.95);
}