import { Button } from "@/components/ui/button";
import { SOCIAL_PRESETS, SocialPreset, CustomSize } from "@shared/schema";
import { CustomSizeInput } from "./custom-size-input";

interface PresetSelectorProps {
  selectedPreset: SocialPreset | null;
  onPresetSelect: (preset: SocialPreset) => void;
  customSize: CustomSize;
  onCustomSizeChange: (size: CustomSize) => void;
  disabled?: boolean;
}

export function PresetSelector({
  selectedPreset,
  onPresetSelect,
  customSize,
  onCustomSizeChange,
  disabled
}: PresetSelectorProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Select Target Format</h3>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(SOCIAL_PRESETS).map(([key, preset]) => (
          <Button
            key={key}
            variant={selectedPreset === key ? "default" : "outline"}
            className="w-full justify-start"
            onClick={() => onPresetSelect(key as SocialPreset)}
            disabled={disabled}
          >
            <div className="text-left">
              <div className="font-medium">{preset.label}</div>
              {key !== "CUSTOM" && (
                <div className="text-xs text-muted-foreground">
                  {preset.width} x {preset.height}
                </div>
              )}
            </div>
          </Button>
        ))}
      </div>

      {selectedPreset === "CUSTOM" && (
        <CustomSizeInput
          value={customSize}
          onChange={onCustomSizeChange}
          disabled={disabled}
        />
      )}
    </div>
  );
}