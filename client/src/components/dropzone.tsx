import { useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DropzoneProps {
  onImageUpload: (file: File) => void;
}

export function Dropzone({ onImageUpload }: DropzoneProps) {
  const { toast } = useToast();

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file",
          variant: "destructive",
        });
        return;
      }
      
      onImageUpload(file);
    },
    [onImageUpload, toast]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onImageUpload(file);
  };

  return (
    <Card
      className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors cursor-pointer"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <label className="flex flex-col items-center justify-center h-48 cursor-pointer">
        <input
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleChange}
        />
        <Upload className="w-12 h-12 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground text-center">
          Drag and drop an image here, or click to select
        </p>
      </label>
    </Card>
  );
}
