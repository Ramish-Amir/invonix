"use client";

import { useState, useEffect } from "react";
import { Upload, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { formatBytes } from "@/lib/services/storageService";

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  createdAt: Date;
  createdBy: string;
  measurementCount?: number;
  fixtureCount?: number;
  updatedAt?: Date;
}

interface FileUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFileSelect: (file: File | string) => void;
  onProjectSelect: (project: Project) => void;
  onNewProject: (
    projectName: string,
    fileName: string,
    file: File,
    onProgress?: (step: UploadStep, progress: number) => void
  ) => void;
  companyId: string;
}

type UploadStep =
  | "idle"
  | "creating-project"
  | "uploading-file"
  | "creating-document"
  | "complete"
  | "error";

export function FileUploadDialog({
  open,
  onOpenChange,
  onFileSelect,
  onProjectSelect,
  onNewProject,
  companyId,
}: FileUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [projectName, setProjectName] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState<UploadStep>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { user } = useAuth();

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedFile(null);
      setProjectName("");
      setIsUploading(false);
      setUploadStep("idle");
      setUploadProgress(0);
      setErrorMessage(null);
    }
  }, [open]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
      // Set project name from file name (remove .pdf extension)
      const nameWithoutExt = file.name.replace(/\.pdf$/i, "");
      setProjectName(nameWithoutExt);
    } else if (file) {
      // Show error for non-PDF files
      alert("Please select a PDF file.");
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile || !projectName.trim()) return;

    setIsUploading(true);
    setUploadStep("creating-project");
    setUploadProgress(10);
    setErrorMessage(null);

    try {
      // Create new project with progress reporting
      await onNewProject(
        projectName.trim(),
        selectedFile.name,
        selectedFile,
        (step, progress) => {
          setUploadStep(step);
          setUploadProgress(progress);
        }
      );

      // Dialog will close automatically when navigation happens
    } catch (error: any) {
      console.error("Error creating project:", error);
      setUploadStep("error");

      // Check if it's a storage limit error
      if (
        error?.message?.includes("Storage limit") ||
        error?.message?.includes("Storage limit exceeded")
      ) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(
          error?.message || "Failed to create project. Please try again."
        );
      }
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const getStepLabel = () => {
    switch (uploadStep) {
      case "creating-project":
        return "Creating project...";
      case "uploading-file":
        return "Uploading file to cloud storage...";
      case "creating-document":
        return "Setting up project document...";
      case "complete":
        return "Project created successfully!";
      case "error":
        return "Error creating project";
      default:
        return "";
    }
  };

  const canSubmit = selectedFile && projectName.trim() && !isUploading;

  const handleDialogClose = (shouldClose: boolean) => {
    // Prevent closing during upload unless it's an error or complete
    if (isUploading && uploadStep !== "error" && uploadStep !== "complete") {
      return;
    }
    onOpenChange(shouldClose);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[500px] max-w-[95vw] w-full">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Upload a PDF file to create a new take-off project.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 min-w-0">
          {/* File Upload */}
          <div className="space-y-2">
            <Label>Select PDF File</Label>
            <div className="relative">
              <input
                id="file-upload"
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                disabled={isUploading}
              />
              <Button
                variant="outline"
                className="w-full justify-start min-w-0 h-auto p-3"
                asChild={false}
                disabled={isUploading}
              >
                {selectedFile ? (
                  <div className="flex items-center justify-between min-w-0 flex-1">
                    <div className="flex justify-start items-center gap-2 min-w-0 flex-1">
                      <FileText className="w-4 h-4 flex-shrink-0 text-primary" />
                      <span
                        title={selectedFile.name}
                        className="truncate min-w-0 flex-1 text-left"
                      >
                        {selectedFile.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="outline" className="text-xs">
                        {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                      </Badge>
                      <Upload className="h-4 w-4 opacity-50" />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 w-full">
                    <span className="flex-1 text-left">Choose PDF file...</span>
                    <Upload className="h-4 w-4 flex-shrink-0 opacity-50" />
                  </div>
                )}
              </Button>
            </div>
          </div>

          {/* Project Name Input */}
          {selectedFile && (
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name"
                disabled={isUploading}
              />
              <p className="text-xs text-muted-foreground">
                The project name will be used to identify this take-off project.
              </p>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {uploadStep !== "complete" && uploadStep !== "error" && (
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    )}
                    {uploadStep === "complete" && (
                      <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                    )}
                    <span className="font-medium">{getStepLabel()}</span>
                  </div>
                  {uploadStep !== "error" && uploadStep !== "complete" && (
                    <span className="text-muted-foreground font-medium">
                      {uploadProgress}%
                    </span>
                  )}
                </div>
                <Progress value={uploadProgress} className="h-2.5" />
              </div>
              {uploadStep === "complete" && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 p-3 rounded-md">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">
                    Project created successfully! Redirecting...
                  </span>
                </div>
              )}
              {uploadStep === "error" && errorMessage && (
                <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-3 rounded-md">
                  <span className="font-medium">{errorMessage}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUploading && uploadStep !== "error"}
          >
            {uploadStep === "error" ? "Close" : "Cancel"}
          </Button>
          {uploadStep !== "error" && (
            <Button onClick={handleSubmit} disabled={!canSubmit}>
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {uploadStep === "complete"
                    ? "Redirecting..."
                    : "Creating Project..."}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Create Project
                </>
              )}
            </Button>
          )}
          {uploadStep === "error" && (
            <Button
              onClick={() => {
                setUploadStep("idle");
                setUploadProgress(0);
                setErrorMessage(null);
                setIsUploading(false);
                handleSubmit();
              }}
              disabled={!selectedFile || !projectName.trim()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
