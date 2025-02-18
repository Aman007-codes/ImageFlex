import imageCompression from "browser-image-compression";
import { ProcessImageInput, SOCIAL_PRESETS } from "@shared/schema";

function getBackgroundGradient(ctx: CanvasRenderingContext2D, img: HTMLImageElement, targetCanvas: HTMLCanvasElement): CanvasGradient {
  const sampleSize = 5;
  const topColors: { r: number; g: number; b: number; }[] = [];
  const bottomColors: { r: number; g: number; b: number; }[] = [];
  const leftColors: { r: number; g: number; b: number; }[] = [];
  const rightColors: { r: number; g: number; b: number; }[] = [];

  // Sample colors from all edges
  for (let i = 0; i < sampleSize; i++) {
    const x = Math.floor((img.width - 1) * (i / (sampleSize - 1)));
    const y = Math.floor((img.height - 1) * (i / (sampleSize - 1)));

    // Top edge
    const topPixel = ctx.getImageData(x, 0, 1, 1).data;
    topColors.push({ r: topPixel[0], g: topPixel[1], b: topPixel[2] });

    // Bottom edge
    const bottomPixel = ctx.getImageData(x, img.height - 1, 1, 1).data;
    bottomColors.push({ r: bottomPixel[0], g: bottomPixel[1], b: bottomPixel[2] });

    // Left edge
    const leftPixel = ctx.getImageData(0, y, 1, 1).data;
    leftColors.push({ r: leftPixel[0], g: leftPixel[1], b: leftPixel[2] });

    // Right edge
    const rightPixel = ctx.getImageData(img.width - 1, y, 1, 1).data;
    rightColors.push({ r: rightPixel[0], g: rightPixel[1], b: rightPixel[2] });
  }

  // Calculate average colors for each edge
  const avgColor = (colors: { r: number; g: number; b: number; }[]) => {
    return colors.reduce(
      (acc, { r, g, b }) => ({
        r: acc.r + r / colors.length,
        g: acc.g + g / colors.length,
        b: acc.b + b / colors.length,
      }),
      { r: 0, g: 0, b: 0 }
    );
  };

  const topAvg = avgColor(topColors);
  const bottomAvg = avgColor(bottomColors);
  const leftAvg = avgColor(leftColors);
  const rightAvg = avgColor(rightColors);

  // Create radial gradient
  const gradient = ctx.createRadialGradient(
    targetCanvas.width / 2, targetCanvas.height / 2, 0,
    targetCanvas.width / 2, targetCanvas.height / 2, 
    Math.max(targetCanvas.width, targetCanvas.height)
  );

  // Add color stops based on edge colors
  gradient.addColorStop(0, `rgb(${Math.round((topAvg.r + leftAvg.r) / 2)}, ${Math.round((topAvg.g + leftAvg.g) / 2)}, ${Math.round((topAvg.b + leftAvg.b) / 2)})`);
  gradient.addColorStop(0.3, `rgb(${Math.round(topAvg.r)}, ${Math.round(topAvg.g)}, ${Math.round(topAvg.b)})`);
  gradient.addColorStop(0.7, `rgb(${Math.round(bottomAvg.r)}, ${Math.round(bottomAvg.g)}, ${Math.round(bottomAvg.b)})`);
  gradient.addColorStop(1, `rgb(${Math.round((bottomAvg.r + rightAvg.r) / 2)}, ${Math.round((bottomAvg.g + rightAvg.g) / 2)}, ${Math.round((bottomAvg.b + rightAvg.b) / 2)})`);

  return gradient;
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

  // Fill background with gradient
  ctx.fillStyle = getBackgroundGradient(tempCtx, img, canvas);
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