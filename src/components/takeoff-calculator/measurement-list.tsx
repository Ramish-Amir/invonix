import React from "react";
import { Measurement } from "./measurement-overlay";
import { Ruler, Tag } from "lucide-react";
import { Badge } from "../ui/badge";
import { Tag as TagType } from "./tag-selector";

interface MeasurementListProps {
  measurements: Measurement[];
  scaleFactor?: number | null; // deprecated
  scaleFactorGetter?: (measurement: Measurement) => number;
  tags: TagType[];
  onMeasurementTagChange?: (measurementId: number, tag: TagType | null) => void;
}

export const MeasurementList: React.FC<MeasurementListProps> = ({
  measurements,
  scaleFactor,
  scaleFactorGetter,
  tags,
  onMeasurementTagChange,
}) => {
  if (measurements.length === 0) return null;

  return (
    <div className="mt-8 space-y-4">
      <div className="flex items-center gap-2">
        <Ruler className="text-primary" size={20} />
        <h2 className="text-lg font-semibold text-gray-800">Measurements</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {measurements.map((m, idx) => {
          const factor = scaleFactorGetter
            ? scaleFactorGetter(m)
            : scaleFactor ?? 1;
          return (
            <div
              key={m.id}
              className="bg-primary/5 border border-primary/20 rounded-md px-4 py-3 shadow-sm"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm text-muted-foreground">
                  Measurement #{idx + 1}
                </div>
                {m.tag && (
                  <Badge
                    variant="secondary"
                    className="text-xs cursor-pointer hover:opacity-80"
                    style={{
                      backgroundColor: m.tag.color,
                      color: "white",
                      borderColor: m.tag.color,
                    }}
                    onClick={() => onMeasurementTagChange?.(m.id, null)}
                    title="Click to remove tag"
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {m.tag.name}
                  </Badge>
                )}
                {!m.tag && onMeasurementTagChange && (
                  <div className="flex gap-1">
                    {tags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        className="text-xs cursor-pointer hover:opacity-80"
                        style={{ borderColor: tag.color }}
                        onClick={() => onMeasurementTagChange(m.id, tag)}
                        title={`Click to assign ${tag.name} tag`}
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-xl font-semibold text-primary">
                {(m.pixelDistance * factor).toFixed(2)} m
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
