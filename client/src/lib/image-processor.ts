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

  // Calculate dimensions after scaling
  const scaledWidth = img.width * scale;
  const scaledHeight = img.height * scale;

  // Add padding to prevent cropping
  const x = (targetSize.width - scaledWidth) / 2;
  const y = (targetSize.height - scaledHeight) / 2;

  // Fill background with white
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw image with smart positioning
  if (preset === "INSTAGRAM_STORY") {
    // For vertical formats, align to top third
    ctx.drawImage(
      img,
      x,
      y * 0.5, // Align more towards top for vertical formats
      scaledWidth,
      scaledHeight
    );
  } else if (preset === "YOUTUBE_THUMBNAIL") {
    // For YouTube thumbnails, maintain center alignment but ensure text visibility
    ctx.drawImage(
      img,
      x,
      y * 0.8, // Slightly higher than center
      scaledWidth,
      scaledHeight
    );
  } else {
    // For square and horizontal formats, use center alignment with smart scaling
    ctx.drawImage(
      img,
      x,
      y,
      scaledWidth,
      scaledHeight
    );
  }

  // Attempt to detect faces using the Face Detection API if available
  try {
    const faceDetector = new window.FaceDetector();
    const faces = await faceDetector.detect(img);

    if (faces.length > 0) {
      // If faces are detected, adjust position to ensure they're visible
      const faceBox = faces[0].boundingBox;
      const faceX = x + (faceBox.x * scale);
      const faceY = y + (faceBox.y * scale);

      // If face would be cropped, adjust the image position
      if (faceX < 0 || faceX + faceBox.width > targetSize.width ||
          faceY < 0 || faceY + faceBox.height > targetSize.height) {
        // Clear canvas and redraw with adjusted position
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(
          img,
          Math.max(x, -faceBox.x * scale),
          Math.max(y, -faceBox.y * scale),
          scaledWidth,
          scaledHeight
        );
      }
    }
  } catch (e) {
    // Face detection not available or failed, continue with current positioning
    console.log("Face detection not available:", e);
  }

  // Convert to data URL with high quality
  return canvas.toDataURL("image/jpeg", 0.95);
}