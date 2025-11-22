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

interface ClearAllFixturesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  fixtureCount: number;
  isLoading?: boolean;
}

export function ClearAllFixturesDialog({
  open,
  onOpenChange,
  onConfirm,
  fixtureCount,
  isLoading = false,
}: ClearAllFixturesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Clear All Fixtures</DialogTitle>
          <DialogDescription>
            Are you sure you want to clear all {fixtureCount}{" "}
            fixture{fixtureCount !== 1 ? "s" : ""} from this project?
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
            {isLoading ? "Clearing..." : "Clear All Fixtures"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

