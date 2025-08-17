import { Scaling, FileAxis3D } from "lucide-react";
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
  setScaleFactor: (newFactorValue: number) => void;
  viewportDimensions: string;
  setViewportDimensions: (newDimensions: string) => void;
};

export const DrawingCallibrationScale = ({
  setScaleFactor,
  viewportDimensions,
  setViewportDimensions,
}: DrawingCallibrationScaleProps) => {
  return (
    <>
      <Select
        defaultValue={DEFAULT_CALLIBRATION_VALUE}
        onValueChange={(value) => setScaleFactor(DrawingCalibrations[value])}
      >
        <SelectTrigger className="w-[80px] min-w-max flex h-9 items-center justify-between whitespace-nowrap rounded-md border border-primary text-primary bg-background px-3 py-2 text-sm shadow-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1">
          <Scaling strokeWidth={2} size={16} className="mr-2" /> <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Select scale</SelectLabel>
            <SelectItem value="125">1:125</SelectItem>
            <SelectItem value="100">1:100</SelectItem>
            <SelectItem value="75">1:75</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <Select
        defaultValue={viewportDimensions}
        onValueChange={(value) => setViewportDimensions(value)}
        value={viewportDimensions}
      >
        <SelectTrigger className="w-[80px] min-w-max flex h-9 items-center justify-between whitespace-nowrap rounded-md border border-primary text-primary bg-background px-3 py-2 text-sm shadow-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1">
          <FileAxis3D strokeWidth={2} size={16} className="mr-2" />{" "}
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Page size</SelectLabel>
            <SelectItem value="42x30">42 x 30</SelectItem>
            <SelectItem value="36x24">36 x 24</SelectItem>
            <SelectItem value="75x50">75 x 50</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </>
  );
};
