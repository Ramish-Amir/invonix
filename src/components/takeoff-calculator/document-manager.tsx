"use client";

import { useState } from "react";
import { Edit2, Save, X, FileText, Calendar, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MeasurementDocument } from "@/lib/types/measurement";
import { updateMeasurementDocument } from "@/lib/services/measurementService";

interface DocumentManagerProps {
  document: MeasurementDocument | null;
  onDocumentUpdate: (document: MeasurementDocument) => void;
  children?: React.ReactNode;
}

export function DocumentManager({
  document,
  onDocumentUpdate,
  children,
}: DocumentManagerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleEditStart = () => {
    if (document) {
      setEditName(document.name);
      setIsEditing(true);
    }
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditName("");
  };

  const handleEditSave = async () => {
    if (!document || !editName.trim()) return;

    setIsSaving(true);
    try {
      await updateMeasurementDocument(document.id, {
        name: editName.trim(),
      });

      const updatedDocument = {
        ...document,
        name: editName.trim(),
        updatedAt: new Date(),
      };

      onDocumentUpdate(updatedDocument);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating document name:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!document) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <FileText className="w-4 h-4" />
        <span className="text-sm">No document loaded</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-muted-foreground" />
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="h-8 w-48"
              placeholder="Document name"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleEditSave();
                if (e.key === "Escape") handleEditCancel();
              }}
              autoFocus
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={handleEditSave}
              disabled={isSaving || !editName.trim()}
            >
              <Save className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleEditCancel}
              disabled={isSaving}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="font-medium">{document.name}</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleEditStart}
              className="h-6 w-6 p-0"
            >
              <Edit2 className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="outline" className="flex items-center gap-1">
          <Ruler className="w-3 h-3" />
          {document.measurements.length} measurements
        </Badge>
        <Badge variant="outline" className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {new Date(document.updatedAt).toLocaleDateString()}
        </Badge>
      </div>

      {children && <div className="ml-auto">{children}</div>}
    </div>
  );
}

// Document Info Dialog Component
interface DocumentInfoDialogProps {
  document: MeasurementDocument | null;
  children: React.ReactNode;
}

export function DocumentInfoDialog({
  document,
  children,
}: DocumentInfoDialogProps) {
  if (!document) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Document Information</DialogTitle>
          <DialogDescription>
            Details about the current measurement document.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Document Name</Label>
              <p className="text-sm text-muted-foreground">{document.name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">File Name</Label>
              <p className="text-sm text-muted-foreground">
                {document.fileName}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Created</Label>
              <p className="text-sm text-muted-foreground">
                {new Date(document.createdAt).toLocaleString()}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Last Updated</Label>
              <p className="text-sm text-muted-foreground">
                {new Date(document.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Measurements</Label>
            <p className="text-sm text-muted-foreground">
              {document.measurements.length} total measurements
            </p>
          </div>

          <div>
            <Label className="text-sm font-medium">Tags</Label>
            <div className="flex flex-wrap gap-1 mt-1">
              {document.tags.length > 0 ? (
                document.tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    style={{
                      backgroundColor: tag.color + "20",
                      color: tag.color,
                    }}
                  >
                    {tag.name}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">No tags</span>
              )}
            </div>
          </div>

          {document.viewportDimensions.width > 0 && (
            <div>
              <Label className="text-sm font-medium">Viewport Dimensions</Label>
              <p className="text-sm text-muted-foreground">
                {document.viewportDimensions.width}" x{" "}
                {document.viewportDimensions.height}"
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
