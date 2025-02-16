import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomSize } from "@shared/schema";

interface CustomSizeInputProps {
  value: CustomSize;
  onChange: (size: CustomSize) => void;
  disabled?: boolean;
}

export function CustomSizeInput({
  value,
  onChange,
  disabled
}: CustomSizeInputProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="width">Width (px)</Label>
          <Input
            id="width"
            type="number"
            value={value.width}
            onChange={(e) => onChange({ ...value, width: Number(e.target.value) })}
            min={50}
            max={4096}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="height">Height (px)</Label>
          <Input
            id="height"
            type="number"
            value={value.height}
            onChange={(e) => onChange({ ...value, height: Number(e.target.value) })}
            min={50}
            max={4096}
            disabled={disabled}
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Min: 50px, Max: 4096px
      </p>
    </div>
  );
}
