"use client";

import { useState, useEffect } from "react";
import { Upload, FileText, Search, Plus, Loader2 } from "lucide-react";
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
  getUserMeasurementDocuments,
  searchMeasurementDocuments,
} from "@/lib/services/measurementService";
import { useAuth } from "@/hooks/useAuth";

interface FileUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFileSelect: (file: File) => void;
  onMeasurementSelect: (document: MeasurementDocument) => void;
  onNewMeasurement: (fileName: string) => void;
}

export function FileUploadDialog({
  open,
  onOpenChange,
  onFileSelect,
  onMeasurementSelect,
  onNewMeasurement,
}: FileUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [measurementChoice, setMeasurementChoice] = useState<
    "new" | "existing"
  >("new");
  const [existingDocuments, setExistingDocuments] = useState<
    MeasurementDocument[]
  >([]);
  const [selectedDocument, setSelectedDocument] =
    useState<MeasurementDocument | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const { user } = useAuth();

  // Load existing documents when dialog opens
  useEffect(() => {
    if (open && user) {
      loadExistingDocuments();
    }
  }, [open, user]);

  // Search documents when search term changes
  useEffect(() => {
    if (searchTerm && user) {
      const timeoutId = setTimeout(() => {
        searchDocuments(searchTerm);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else if (!searchTerm && user) {
      loadExistingDocuments();
    }
  }, [searchTerm, user]);

  const loadExistingDocuments = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const docs = await getUserMeasurementDocuments(user.uid);
      setExistingDocuments(docs);
    } catch (error) {
      console.error("Error loading existing documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const searchDocuments = async (term: string) => {
    if (!user) return;

    setSearching(true);
    try {
      const docs = await searchMeasurementDocuments(user.uid, term);
      setExistingDocuments(docs);
    } catch (error) {
      console.error("Error searching documents:", error);
    } finally {
      setSearching(false);
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
      onNewMeasurement(selectedFile.name);
    } else if (measurementChoice === "existing" && selectedDocument) {
      onMeasurementSelect(selectedDocument);
    }

    onFileSelect(selectedFile);
    onOpenChange(false);

    // Reset state
    setSelectedFile(null);
    setMeasurementChoice("new");
    setSelectedDocument(null);
    setSearchTerm("");
  };

  const canSubmit =
    selectedFile &&
    (measurementChoice === "new" ||
      (measurementChoice === "existing" && selectedDocument));

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
              <Label>Select Measurement Document</Label>
              <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={searchOpen}
                    className="w-full justify-start min-w-0"
                  >
                    {selectedDocument ? (
                      <div className="flex items-center justify-between min-w-0 flex-1">
                        <div className="flex justify-start items-center gap-2 min-w-0 flex-1">
                          <FileText className="w-4 h-4 flex-shrink-0" />
                          <span
                            title={selectedDocument.name}
                            className="truncate min-w-0 flex-1"
                          >
                            {selectedDocument.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge variant="outline" className="text-xs">
                            {selectedDocument.measurements.length} measurements
                          </Badge>
                          <Search className="h-4 w-4 opacity-50" />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 w-full">
                        <span className="flex-1 text-left">
                          Select measurement document...
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
                      ) : existingDocuments.length === 0 ? (
                        <CommandEmpty>No documents found.</CommandEmpty>
                      ) : (
                        <CommandGroup>
                          {existingDocuments.map((doc) => (
                            <CommandItem
                              key={doc.id}
                              value={`${doc.id}-${doc.name}`}
                              onSelect={() => {
                                setSelectedDocument(doc);
                                setSearchOpen(false);
                              }}
                            >
                              <div className="flex items-center gap-2 w-full min-w-0">
                                <FileText className="w-4 h-4 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate">
                                    {doc.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground truncate">
                                    {doc.fileName} • {doc.measurements.length}{" "}
                                    measurements
                                  </div>
                                </div>
                                <Badge
                                  variant="outline"
                                  className="text-xs flex-shrink-0"
                                >
                                  {new Date(doc.updatedAt).toLocaleDateString()}
                                </Badge>
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
