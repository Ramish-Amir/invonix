"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ClearAllMeasurementsButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export function ClearAllMeasurementsButton({
  onClick,
  disabled = false,
  className,
}: ClearAllMeasurementsButtonProps) {
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-8 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground",
        className
      )}
    >
      <Trash2 className="w-3 h-3 mr-1" />
      Clear All
    </Button>
  );
}

