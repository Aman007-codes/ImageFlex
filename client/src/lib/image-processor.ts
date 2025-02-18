import imageCompression from "browser-image-compression";
import { ProcessImageInput, SOCIAL_PRESETS } from "@shared/schema";

function getBackground(ctx: CanvasRenderingContext2D, img: HTMLImageElement, targetCanvas: HTMLCanvasElement): string | CanvasGradient {
  try {
    const sampleSize = 10;
    const edgeColors: { r: number; g: number; b: number; }[] = [];
    
    // Sample colors from all edges with error handling
    for (let i = 0; i < sampleSize; i++) {
      try {
        const x = Math.floor((img.width - 1) * (i / (sampleSize - 1)));
        const y = Math.floor((img.height - 1) * (i / (sampleSize - 1)));

        // Sample from all edges
        const positions = [
          [x, 0],             // top
          [x, img.height - 1], // bottom
          [0, y],             // left
          [img.width - 1, y]  // right
        ];

        for (const [px, py] of positions) {
          const pixel = ctx.getImageData(px, py, 1, 1).data;
          edgeColors.push({ r: pixel[0], g: pixel[1], b: pixel[2] });
        }
      } catch (e) {
        console.warn("Error sampling color:", e);
        continue;
      }
    }

    if (edgeColors.length === 0) {
      return 'rgb(255, 255, 255)'; // Fallback to white if no colors sampled
    }

  // Check if colors are similar (indicating solid background)
    const isColorsSimilar = (colors: typeof edgeColors): boolean => {
      const threshold = 15;
      const firstColor = colors[0];
      return colors.every(color => 
        Math.abs(color.r - firstColor.r) <= threshold &&
        Math.abs(color.g - firstColor.g) <= threshold &&
        Math.abs(color.b - firstColor.b) <= threshold
      );
    };

    // If colors are similar, use solid background
    if (isColorsSimilar(edgeColors)) {
      const avg = edgeColors.reduce(
        (acc, { r, g, b }) => ({
          r: acc.r + r / edgeColors.length,
          g: acc.g + g / edgeColors.length,
          b: acc.b + b / edgeColors.length,
        }),
        { r: 0, g: 0, b: 0 }
      );
      return `rgb(${Math.round(avg.r)}, ${Math.round(avg.g)}, ${Math.round(avg.b)})`;
    }

    // Create gradient for varying colors
    const gradient = ctx.createLinearGradient(0, 0, targetCanvas.width, targetCanvas.height);
    
    // Calculate color stops
    const numStops = 4;
    for (let i = 0; i < numStops; i++) {
      const colorIndex = Math.floor((edgeColors.length - 1) * (i / (numStops - 1)));
      const color = edgeColors[colorIndex];
      gradient.addColorStop(i / (numStops - 1), 
        `rgb(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)})`
      );
    }

    return gradient;
  } catch (error) {
    console.error("Background processing error:", error);
    return 'rgb(255, 255, 255)'; // Fallback to white on error
  }
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

  // Fill background with appropriate style
  ctx.fillStyle = getBackground(tempCtx, img, canvas);
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