import { Redo, Undo, PinOff } from "lucide-react";
import { Slider } from "../ui/slider";

type TakeoffControlMenuProps = {
  scale: number;
  setScale: (newValue: number) => void;
  handleUndo: () => void;
  handleRedo: () => void;
  pinnedCount: number;
  onClearAllPins: () => void;
};

export const TakeoffControlMenu = ({
  scale,
  setScale,
  handleRedo,
  handleUndo,
  pinnedCount,
  onClearAllPins,
}: TakeoffControlMenuProps) => {
  return (
    <div className="absolute top-6 right-6 z-[1] flex gap-2 items-center">
      <div
        onClick={handleUndo}
        className="flex h-[46px] p-3 items-center justify-center rounded-lg shadow backdrop-blur supports-[backdrop-filter]:bg-primary/40 opacity-90 hover:opacity-100 transition-opacity"
      >
        <Undo className="w-4 h-4 text-primary" strokeWidth={3} />
      </div>
      <div
        onClick={handleRedo}
        className="flex h-[46px] p-3 items-center justify-center rounded-lg shadow backdrop-blur supports-[backdrop-filter]:bg-primary/40 opacity-90 hover:opacity-100 transition-opacity"
      >
        <Redo className="w-4 h-4 text-primary" strokeWidth={3} />
      </div>
      <div className="flex flex-col h-[46px] items-center gap-2 px-4 pt-3 pb-1 rounded-lg shadow backdrop-blur supports-[backdrop-filter]:bg-primary/40 opacity-90 hover:opacity-100 transition-opacity">
        <Slider
          min={1}
          max={10}
          step={0.05}
          value={[scale]}
          onValueChange={([val]) => setScale(val)}
          className="w-[150px]"
        />
        <div className="text-xs text-gray-800 whitespace-nowrap">
          {(scale * 100).toFixed(0)}%
        </div>
      </div>

      {pinnedCount > 0 && (
        <div
          onClick={onClearAllPins}
          className="flex h-[46px] p-3 items-center justify-center rounded-lg shadow backdrop-blur supports-[backdrop-filter]:bg-primary/40 opacity-90 hover:opacity-100 transition-opacity cursor-pointer"
          title="Clear all pinned measurements"
        >
          <PinOff className="w-4 h-4 text-primary" strokeWidth={3} />
          <span className="ml-1 text-xs text-primary font-medium">
            {pinnedCount}
          </span>
        </div>
      )}
    </div>
  );
};
