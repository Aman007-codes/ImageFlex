
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Download, ZoomIn, ZoomOut } from "lucide-react";

interface ImagePreviewProps {
  originalImage: File | null;
  processedImage: string | null;
  selectedPreset: { width: number; height: number; label: string } | null;
  isProcessing: boolean;
  onZoomChange?: (zoom: number) => void;
  zoomLevel?: number;
}

export function ImagePreview({
  originalImage,
  processedImage,
  selectedPreset,
  isProcessing,
  onZoomChange = () => {},
  zoomLevel = 1,
}: ImagePreviewProps) {
  const handleDownload = () => {
    if (!processedImage) return;

    const link = document.createElement("a");
    link.href = processedImage;
    link.download = `processed-${originalImage?.name || "image"}.jpg`;
    link.click();
  };

  if (!originalImage) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Upload an image to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-4">Original</h3>
        <img
          src={URL.createObjectURL(originalImage)}
          alt="Original"
          className="w-full h-64 object-contain bg-muted rounded-lg"
        />
      </div>

      <div>
        <h3 className="font-semibold mb-4">
          {selectedPreset ? `${selectedPreset.label} Preview` : "Preview"}
        </h3>
        {isProcessing ? (
          <Skeleton className="w-full h-96 rounded-lg" />
        ) : processedImage ? (
          <img
            src={processedImage}
            alt="Processed"
            className="w-full h-96 object-contain bg-muted rounded-lg"
          />
        ) : (
          <div className="w-full h-96 bg-muted rounded-lg flex items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Select a preset to preview
            </p>
          </div>
        )}
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

          <Button className="w-full" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download Processed Image
          </Button>
        </div>
      )}
    </div>
  );
}
