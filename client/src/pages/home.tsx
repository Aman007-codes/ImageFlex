import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Dropzone } from "@/components/dropzone";
import { PresetSelector } from "@/components/preset-selector";
import { ImagePreview } from "@/components/image-preview";
import { processImage } from "@/lib/image-processor";
import { useToast } from "@/hooks/use-toast";
import { ProcessImageInput, SOCIAL_PRESETS, SocialPreset, CustomSize } from "@shared/schema";

export default function Home() {
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<SocialPreset | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [customSize, setCustomSize] = useState<CustomSize>({ width: 800, height: 600 });
  const { toast } = useToast();

  const handleImageUpload = (file: File) => {
    setOriginalImage(file);
    setProcessedImage(null);
    setZoomLevel(1.0);
  };

  const handlePresetSelect = async (preset: SocialPreset) => {
    if (!originalImage) {
      toast({
        title: "No image selected",
        description: "Please upload an image first",
        variant: "destructive",
      });
      return;
    }

    setSelectedPreset(preset);
    await processImageWithPreset(preset);
  };

  const processImageWithPreset = async (preset: SocialPreset) => {
    if (!originalImage) return;

    setIsProcessing(true);
    try {
      const result = await processImage({
        file: originalImage,
        preset,
        customSize: preset === "CUSTOM" ? customSize : undefined,
        zoomLevel,
      });
      setProcessedImage(result);
    } catch (error) {
      toast({
        title: "Processing failed",
        description: "Failed to process image",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleZoomChange = async (newZoom: number) => {
    setZoomLevel(newZoom);
    if (selectedPreset) {
      await processImageWithPreset(selectedPreset);
    }
  };

  const handleCustomSizeChange = async (newSize: CustomSize) => {
    setCustomSize(newSize);
    if (selectedPreset === "CUSTOM") {
      await processImageWithPreset("CUSTOM");
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="w-1/3 p-6 border-r">
        <div className="space-y-6">
          <Dropzone onImageUpload={handleImageUpload} />
          <PresetSelector
            selectedPreset={selectedPreset}
            onPresetSelect={handlePresetSelect}
            customSize={customSize}
            onCustomSizeChange={handleCustomSizeChange}
            disabled={!originalImage || isProcessing}
          />
        </div>
      </div>

      <div className="flex-1 p-6">
        <ImagePreview
          originalImage={originalImage}
          processedImage={processedImage}
          selectedPreset={selectedPreset ? 
            selectedPreset === "CUSTOM" ? 
              { ...SOCIAL_PRESETS.CUSTOM, ...customSize } : 
              SOCIAL_PRESETS[selectedPreset] 
            : null}
          isProcessing={isProcessing}
          onZoomChange={handleZoomChange}
          zoomLevel={zoomLevel}
        />
      </div>
    </div>
  );
}