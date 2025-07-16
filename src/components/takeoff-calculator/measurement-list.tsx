import React from "react";
import { Measurement } from "./measurement-overlay";
import { Ruler } from "lucide-react";

interface MeasurementListProps {
  measurements: Measurement[];
  scaleFactor: number | null;
}

export const MeasurementList: React.FC<MeasurementListProps> = ({
  measurements,
  scaleFactor,
}) => {
  if (!scaleFactor || measurements.length === 0) return null;

  return (
    <div className="mt-8 space-y-4">
      <div className="flex items-center gap-2">
        <Ruler className="text-primary" size={20} />
        <h2 className="text-lg font-semibold text-gray-800">Measurements</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {measurements.map((m, idx) => (
          <div
            key={m.id}
            className="bg-primary/5 border border-primary/20 rounded-md px-4 py-3 shadow-sm"
          >
            <div className="text-sm text-muted-foreground mb-1">
              Measurement #{idx + 1}
            </div>
            <div className="text-xl font-semibold text-primary">
              {(m.pixelDistance * scaleFactor).toFixed(2)} m
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
