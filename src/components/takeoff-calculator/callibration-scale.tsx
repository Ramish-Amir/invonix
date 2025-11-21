import { Scaling, Layers, FileText } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  DEFAULT_CALLIBRATION_VALUE,
  DrawingCalibrations,
} from "@/lib/drawingCallibrations";

type DrawingCallibrationScaleProps = {
  callibrationScale: string;
  setCallibrationScale: (newCallibrationScale: string) => void;
  scaleMode?: "universal" | "per-page";
  onScaleModeChange?: (mode: "universal" | "per-page") => void;
};

export const DrawingCallibrationScale = ({
  callibrationScale,
  setCallibrationScale,
  scaleMode = "universal",
  onScaleModeChange,
}: DrawingCallibrationScaleProps) => {
  return (
    <>
      <Select
        defaultValue={DEFAULT_CALLIBRATION_VALUE}
        onValueChange={(value: keyof typeof DrawingCalibrations) =>
          setCallibrationScale(value)
        }
        value={callibrationScale || DEFAULT_CALLIBRATION_VALUE}
      >
        <SelectTrigger className="w-[100px] min-w-max flex h-9 items-center justify-between whitespace-nowrap rounded-md border border-primary text-primary bg-background px-3 py-2 text-sm shadow-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1">
          <div className="flex items-center gap-1.5">
            <Scaling strokeWidth={2} size={16} />
            <SelectValue />
            {scaleMode === "universal" ? (
              <Layers className="w-3.5 h-3.5 opacity-70" strokeWidth={2} />
            ) : (
              <FileText className="w-3.5 h-3.5 opacity-70" strokeWidth={2} />
            )}
          </div>
        </SelectTrigger>
        <SelectContent className="p-0">
          {onScaleModeChange && (
            <div
              className="px-3 py-2.5 border-b border-border bg-muted/30"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-2.5">
                <span className="text-xs font-semibold text-foreground tracking-wide">
                  Apply to
                </span>
              </div>
              <div className="relative inline-flex items-center w-full rounded-md border border-border/50 bg-background p-1 shadow-sm">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onScaleModeChange("universal");
                  }}
                  className={`relative flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-sm transition-all duration-200 min-w-0 ${
                    scaleMode === "universal"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
                >
                  <Layers
                    className="w-3.5 h-3.5 flex-shrink-0"
                    strokeWidth={2}
                  />
                  <span className="font-medium whitespace-nowrap">
                    All Pages
                  </span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onScaleModeChange("per-page");
                  }}
                  className={`relative flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-sm transition-all duration-200 min-w-0 ${
                    scaleMode === "per-page"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
                >
                  <FileText
                    className="w-3.5 h-3.5 flex-shrink-0"
                    strokeWidth={2}
                  />
                  <span className="font-medium whitespace-nowrap">
                    This Page
                  </span>
                </button>
              </div>
            </div>
          )}
          <SelectGroup>
            <SelectLabel className="px-3 py-1.5 text-xs font-semibold text-foreground">
              Select scale
            </SelectLabel>
            <SelectItem value="500">1:500</SelectItem>
            <SelectItem value="300">1:300</SelectItem>
            <SelectItem value="250">1:250</SelectItem>
            <SelectItem value="200">1:200</SelectItem>
            <SelectItem value="150">1:150</SelectItem>
            <SelectItem value="125">1:125</SelectItem>
            <SelectItem value="100">1:100</SelectItem>
            <SelectItem value="75">1:75</SelectItem>
            <SelectItem value="50">1:50</SelectItem>
            <SelectItem value="30">1:30</SelectItem>
            <SelectItem value="20">1:20</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </>
  );
};
