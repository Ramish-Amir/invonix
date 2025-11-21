"use client";

import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocumentInfoDialog } from "./document-manager";
import { ClearAllMeasurementsButton } from "./clear-all-measurements-button";
import { MeasurementDocument } from "@/lib/types/measurement";

interface DocumentActionsProps {
  document: MeasurementDocument;
  measurementCount: number;
  onClearAll: () => void;
}

export function DocumentActions({
  document,
  measurementCount,
  onClearAll,
}: DocumentActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <DocumentInfoDialog document={document}>
        <Button size="sm" variant="outline" className="h-8">
          <Info className="w-3 h-3" />
        </Button>
      </DocumentInfoDialog>
      <ClearAllMeasurementsButton
        onClick={onClearAll}
        disabled={measurementCount === 0}
      />
    </div>
  );
}

