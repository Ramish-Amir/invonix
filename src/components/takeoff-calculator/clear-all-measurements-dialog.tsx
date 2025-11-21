"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ClearAllMeasurementsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  measurementCount: number;
  isLoading?: boolean;
}

export function ClearAllMeasurementsDialog({
  open,
  onOpenChange,
  onConfirm,
  measurementCount,
  isLoading = false,
}: ClearAllMeasurementsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Clear All Measurements</DialogTitle>
          <DialogDescription>
            Are you sure you want to clear all {measurementCount}{" "}
            measurement{measurementCount !== 1 ? "s" : ""} from this project?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Clearing..." : "Clear All Measurements"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

