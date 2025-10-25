"use client";

import { useState, useEffect } from "react";
import {
  Upload,
  FileText,
  Search,
  Plus,
  Loader2,
  Calendar,
} from "lucide-react";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { MeasurementDocument } from "@/lib/types/measurement";
import {
  getProjectMeasurementDocuments,
  searchProjectMeasurementDocuments,
  getCompanyProjects,
} from "@/lib/services/measurementService";
import { useAuth } from "@/hooks/useAuth";

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
  onFileSelect: (file: File) => void;
  onProjectSelect: (project: Project) => void;
  onNewProject: (fileName: string) => void;
  companyId: string;
}

export function FileUploadDialog({
  open,
  onOpenChange,
  onFileSelect,
  onProjectSelect,
  onNewProject,
  companyId,
}: FileUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [measurementChoice, setMeasurementChoice] = useState<
    "new" | "existing"
  >("new");
  const [existingProjects, setExistingProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const { user } = useAuth();

  // Load existing projects when dialog opens
  useEffect(() => {
    if (open && user && companyId) {
      loadExistingProjects();
    }
  }, [open, user, companyId]);

  const loadExistingProjects = async () => {
    if (!user || !companyId) return;

    setLoading(true);
    try {
      const projects = await getCompanyProjects(companyId);

      // Enhance projects with measurement data and updatedAt
      const enhancedProjects = await Promise.all(
        projects.map(async (project) => {
          try {
            // Get measurement documents for this project
            const measurementDocs = await getProjectMeasurementDocuments(
              companyId,
              project.id
            );

            // Get the most recent updatedAt from measurement documents
            let latestUpdatedAt = project.createdAt;
            if (measurementDocs.length > 0) {
              const latestDoc = measurementDocs.reduce((latest, doc) =>
                doc.updatedAt > latest.updatedAt ? doc : latest
              );
              latestUpdatedAt = latestDoc.updatedAt;
            }

            return {
              ...project,
              measurementCount: measurementDocs.length,
              updatedAt: latestUpdatedAt,
            };
          } catch (error) {
            console.error(
              `Error loading data for project ${project.id}:`,
              error
            );
            return {
              ...project,
              measurementCount: 0,
              updatedAt: project.createdAt,
            };
          }
        })
      );

      // Sort by updatedAt descending (most recent first)
      const sortedProjects = enhancedProjects.sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt).getTime() -
          new Date(a.updatedAt || a.createdAt).getTime()
      );

      setExistingProjects(sortedProjects);
    } catch (error) {
      console.error("Error loading existing projects:", error);
      // If there's a permission error or no projects exist, show empty list
      setExistingProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
    } else if (file) {
      // Show error for non-PDF files
      alert("Please select a PDF file.");
    }
  };

  const handleSubmit = () => {
    if (!selectedFile) return;

    if (measurementChoice === "new") {
      onNewProject(selectedFile.name);
    } else if (measurementChoice === "existing" && selectedProject) {
      onProjectSelect(selectedProject);
    }

    onFileSelect(selectedFile);
    onOpenChange(false);

    // Reset state
    setSelectedFile(null);
    setMeasurementChoice("new");
    setSelectedProject(null);
    setSearchTerm("");
  };

  const canSubmit =
    selectedFile &&
    (measurementChoice === "new" ||
      (measurementChoice === "existing" && selectedProject));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-w-[95vw] w-full">
        <DialogHeader>
          <DialogTitle>New Take-off Project</DialogTitle>
          <DialogDescription>
            Select a PDF file and choose how to handle measurements for your new
            take-off project.
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
              />
              <Button
                variant="outline"
                className="w-full justify-start min-w-0 h-auto p-3"
                asChild={false}
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

          {/* Measurement Choice */}
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-semibold">
                Measurement Options
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Choose how to handle measurements for your new take-off project.
              </p>
            </div>

            <div className="space-y-2">
              {/* New Measurements Option */}
              <div
                className={`relative cursor-pointer rounded-md border p-3 transition-all duration-200 ${
                  measurementChoice === "new"
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-muted-foreground/50"
                }`}
                onClick={() => setMeasurementChoice("new")}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <Plus className="w-4 h-4 text-primary flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-medium text-foreground">
                        New Measurements
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Start fresh with new measurements for this drawing.
                      </p>
                    </div>
                  </div>
                  <div className="ml-3 flex-shrink-0">
                    <div
                      className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                        measurementChoice === "new"
                          ? "border-primary bg-primary"
                          : "border-muted-foreground"
                      }`}
                    >
                      {measurementChoice === "new" && (
                        <div className="w-full h-full rounded-full bg-primary-foreground scale-50"></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Existing Measurements Option */}
              <div
                className={`relative cursor-pointer rounded-md border p-3 transition-all duration-200 ${
                  measurementChoice === "existing"
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-muted-foreground/50"
                }`}
                onClick={() => setMeasurementChoice("existing")}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <Search className="w-4 h-4 text-primary flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-medium text-foreground">
                        Existing Measurements
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Continue with measurements from a previous project.
                      </p>
                    </div>
                  </div>
                  <div className="ml-3 flex-shrink-0">
                    <div
                      className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                        measurementChoice === "existing"
                          ? "border-primary bg-primary"
                          : "border-muted-foreground"
                      }`}
                    >
                      {measurementChoice === "existing" && (
                        <div className="w-full h-full rounded-full bg-primary-foreground scale-50"></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Existing Documents Selector */}
          <div
            className={`overflow-hidden transition-all duration-500 ease-out ${
              measurementChoice === "existing"
                ? "max-h-[120px] opacity-100"
                : "max-h-0 opacity-0"
            }`}
          >
            <div className="space-y-2 min-w-0 pt-2">
              <Label>Select Project</Label>
              <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={searchOpen}
                    className="w-full justify-start min-w-0"
                  >
                    {selectedProject ? (
                      <div className="flex items-center justify-between min-w-0 flex-1">
                        <div className="flex justify-start items-center gap-2 min-w-0 flex-1">
                          <FileText className="w-4 h-4 flex-shrink-0" />
                          <span
                            title={selectedProject.name}
                            className="truncate min-w-0 flex-1 text-left"
                          >
                            {selectedProject.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge variant="outline" className="text-xs">
                            {selectedProject?.measurementCount || 0}{" "} measurements
                          </Badge>
                          <Search className="h-4 w-4 opacity-50" />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 w-full">
                        <span className="flex-1 text-left">
                          Select existing project...
                        </span>
                        <Search className="h-4 w-4 flex-shrink-0 opacity-50" />
                      </div>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[500px] max-w-[90vw] p-0"
                  align="start"
                >
                  <Command>
                    <CommandInput
                      placeholder="Search documents..."
                      value={searchTerm}
                      onValueChange={setSearchTerm}
                    />
                    <CommandList>
                      {loading || searching ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="ml-2 text-sm text-muted-foreground">
                            {loading ? "Loading..." : "Searching..."}
                          </span>
                        </div>
                      ) : existingProjects.length === 0 ? (
                        <CommandEmpty>No projects found.</CommandEmpty>
                      ) : (
                        <CommandGroup className="p-1 space-y-0.5 bg-muted/30 rounded-lg">
                          {existingProjects.map((project) => (
                            <CommandItem
                              key={project.id}
                              value={`${project.id}-${project.name}`}
                              onSelect={() => {
                                setSelectedProject(project);
                                setSearchOpen(false);
                              }}
                              className="p-2 cursor-pointer hover:bg-accent/50 transition-all duration-200 rounded-lg hover:shadow-sm"
                            >
                              <div className="flex items-center gap-3 w-full">
                                <div className="flex-shrink-0">
                                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-sm">
                                    <FileText className="w-4 h-4 text-primary" />
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-medium text-sm text-foreground truncate">
                                      {project.name}
                                    </h4>
                                    <div className="flex items-center gap-2 ml-2">
                                      <div className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded">
                                        {project.measurementCount || 0}{" "}
                                        measurements
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                    <Calendar className="w-3 h-3" />
                                    <span>
                                      Updated{" "}
                                      {new Date(
                                        project.updatedAt || project.createdAt
                                      ).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                      })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            <Upload className="w-4 h-4 mr-2" />
            Start Take-off
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
