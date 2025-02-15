import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Download, ZoomIn, ZoomOut } from "lucide-react";
import { useRef, useState, useEffect } from "react";

interface ImagePreviewProps {
  originalImage: File | null;
  processedImage: string | null;
  selectedPreset: { width: number; height: number; label: string } | null;
  isProcessing: boolean;
  onZoomChange?: (zoom: number) => void;
  onPositionChange?: (x: number, y: number) => void;
  zoomLevel?: number;
}

export function ImagePreview({
  originalImage,
  processedImage,
  selectedPreset,
  isProcessing,
  onZoomChange = () => {},
  onPositionChange = () => {},
  zoomLevel = 1,
}: ImagePreviewProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const previewRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    if (!processedImage) return;

    const link = document.createElement("a");
    link.href = processedImage;
    link.download = `processed-${originalImage?.name || "image"}.jpg`;
    link.click();
  };

  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!processedImage) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleDragMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !processedImage) return;

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    // Limit dragging to reasonable bounds
    const bounds = 200; // Maximum drag distance
    const clampedX = Math.max(-bounds, Math.min(bounds, newX));
    const clampedY = Math.max(-bounds, Math.min(bounds, newY));

    setPosition({ x: clampedX, y: clampedY });
    onPositionChange(clampedX, clampedY);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    // Reset position when image changes
    setPosition({ x: 0, y: 0 });
  }, [originalImage, selectedPreset]);

  if (!originalImage) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Upload an image to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold mb-2">Original</h3>
          <img
            src={URL.createObjectURL(originalImage)}
            alt="Original"
            className="w-full h-48 object-contain bg-muted rounded-lg"
          />
        </div>

        <div>
          <h3 className="font-semibold mb-2">
            {selectedPreset ? `${selectedPreset.label} Preview` : "Preview"}
          </h3>
          <div
            ref={previewRef}
            className="relative w-full h-48 bg-muted rounded-lg overflow-hidden"
            onMouseDown={handleDragStart}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            style={{ cursor: isDragging ? "grabbing" : "grab" }}
          >
            {isProcessing ? (
              <Skeleton className="w-full h-48 rounded-lg" />
            ) : processedImage ? (
              <img
                src={processedImage}
                alt="Processed"
                className="w-full h-48 object-contain"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px)`,
                  transition: isDragging ? "none" : "transform 0.1s ease-out"
                }}
              />
            ) : (
              <div className="w-full h-48 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  Select a preset to preview
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {processedImage && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ZoomOut className="w-4 h-4 text-muted-foreground" />
            <Slider
              value={[zoomLevel]}
              min={0.5}
              max={2}
              step={0.1}
              onValueChange={([value]) => onZoomChange(value)}
              className="flex-1"
            />
            <ZoomIn className="w-4 h-4 text-muted-foreground" />
          </div>

          <Button
            className="w-full"
            onClick={handleDownload}
          >
            <Download className="w-4 h-4 mr-2" />
            Download Processed Image
          </Button>
        </div>
      )}
    </div>
  );
}