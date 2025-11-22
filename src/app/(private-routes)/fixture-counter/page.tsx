"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { pdfjs, Document, Page } from "react-pdf";
import {
  Upload,
  FileText,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { TakeoffControlMenu } from "@/components/takeoff-calculator/control-menu";
import { DrawingCallibrationScale } from "@/components/takeoff-calculator/callibration-scale";
import { FixtureOverlay } from "@/components/fixture-counter/fixture-overlay";
import { TagSelector, Tag } from "@/components/takeoff-calculator/tag-selector";
import { FixtureSummary } from "@/components/fixture-counter/fixture-summary";
import { FileUploadDialog } from "@/components/takeoff-calculator/file-upload-dialog";
import { DocumentManager } from "@/components/takeoff-calculator/document-manager";
import { DocumentActions } from "@/components/takeoff-calculator/document-actions";
import { ClearAllFixturesDialog } from "@/components/fixture-counter/clear-all-fixtures-dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useAutoSaveFixtures } from "@/hooks/useAutoSaveFixtures";
import { useAuth } from "@/hooks/useAuth";
import { DEFAULT_CALLIBRATION_VALUE } from "@/lib/drawingCallibrations";
import { FixtureDocument, Fixture, Point } from "@/lib/types/fixture";
import { MeasurementDocument } from "@/lib/types/measurement";
import {
  createFixtureDocument,
  getFixtureDocument,
  getProjectFixtureDocuments,
  updateFixtureDocument,
} from "@/lib/services/fixtureService";
import {
  getProjectMeasurementDocuments,
  getMeasurementDocument,
} from "@/lib/services/measurementService";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const options = {
  cMapUrl: "/cmaps/",
  standardFontDataUrl: "/standard_fonts/",
  wasmUrl: "/wasm/",
};

type PDFFile = string | File | null;

const maxWidth = 800;

export default function FixtureCounter() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [companyId, setCompanyId] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("");

  const [file, setFile] = useState<PDFFile>(null);
  const [numPages, setNumPages] = useState<number>();
  // Per-page scale (zoom) and calibration factor
  const [pageScales, setPageScales] = useState<{ [page: number]: number }>({});
  const [containerWidth, setContainerWidth] = useState<number>();
  const [pagesWidth, setPagesWidth] = useState<{ [page: number]: number }>({}); // New state to track individual page widths
  const [callibrationScale, setCallibrationScale] = useState<{
    [page: number]: string;
  }>({});
  const [viewportDimensions, setViewportDimensions] = useState<{
    width: number;
    height: number;
  }>({
    width: 0,
    height: 0,
  });
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [history, setHistory] = useState<Fixture[][]>([]);
  const [redoStack, setRedoStack] = useState<Fixture[][]>([]);

  // Document management state
  const [currentDocument, setCurrentDocument] =
    useState<FixtureDocument | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [clearFixturesDialogOpen, setClearFixturesDialogOpen] = useState(false);

  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [pinnedIds, setPinnedIds] = useState<Set<number>>(new Set());

  // Tag state (fixture names)
  const [tags, setTags] = useState<Tag[]>([
    { id: "1", name: "FD-1", color: "#ef4444" },
  ]);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(tags[0]);

  // Scale mode: 'universal' applies to all pages, 'per-page' applies to current page only
  const [scaleMode, setScaleMode] = useState<"universal" | "per-page">(
    "universal"
  );

  // Get user's company ID and create project if needed
  const initializeUserData = async () => {
    if (!user) return;

    try {
      // Get user's company ID from their profile
      const userDoc = await getDoc(doc(db, "adminUsers", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setCompanyId(userData.companyId || "");
      }

      // Check if projectId is provided in URL (for existing projects)
      const urlProjectId = searchParams.get("projectId");
      if (urlProjectId) {
        setProjectId(urlProjectId);
      }
    } catch (error) {
      console.error("Error getting user data:", error);
    }
  };

  // Initialize user data on component mount
  useEffect(() => {
    initializeUserData();
  }, [user]);

  // Load project when projectId is in URL
  useEffect(() => {
    const loadProjectFromUrl = async () => {
      if (!companyId || !projectId || !user) return;

      try {
        // First try to load existing fixture documents from this project
        let docs = await getProjectFixtureDocuments(companyId, projectId);
        let fullDocument: FixtureDocument | null = null;

        if (docs.length > 0) {
          // Load the most recent fixture document
          const latestDoc = docs[0];
          fullDocument = await getFixtureDocument(
            companyId,
            projectId,
            latestDoc.id
          );
        } else {
          // If no fixture documents exist, check for measurement documents
          // and use their fileUrl to load the PDF (user can start marking fixtures)
          const measurementDocs = await getProjectMeasurementDocuments(
            companyId,
            projectId
          );
          if (measurementDocs.length > 0) {
            const latestMeasurementDoc = measurementDocs[0];
            const measurementDocument = await getMeasurementDocument(
              companyId,
              projectId,
              latestMeasurementDoc.id
            );
            if (measurementDocument && measurementDocument.fileUrl) {
              // Create a new fixture document using the measurement document's file info
              const fixtureDocId = await createFixtureDocument(
                companyId,
                projectId,
                {
                  name: measurementDocument.name + " (Fixtures)",
                  fileName: measurementDocument.fileName,
                  fileUrl: measurementDocument.fileUrl,
                  fileSize: measurementDocument.fileSize,
                  userId: measurementDocument.userId,
                }
              );

              // Load the newly created fixture document
              const newFixtureDocument = await getFixtureDocument(
                companyId,
                projectId,
                fixtureDocId
              );

              if (newFixtureDocument) {
                setCurrentDocument(newFixtureDocument);
                setFixtures([]);
                setTags([{ id: "1", name: "FD-1", color: "#ef4444" }]);
                setPageScales(measurementDocument.pageScales || {});
                setCallibrationScale(
                  measurementDocument.callibrationScale || {}
                );
                setViewportDimensions(
                  measurementDocument.viewportDimensions || {
                    width: 0,
                    height: 0,
                  }
                );

                // Load PDF from cloud URL
                const proxyUrl = `/api/proxy-pdf?url=${encodeURIComponent(
                  measurementDocument.fileUrl
                )}`;
                setFile(proxyUrl);
              }
            }
            return; // Exit early
          }
        }

        if (fullDocument) {
          setCurrentDocument(fullDocument);
          setFixtures(fullDocument.fixtures || []);
          setTags(
            fullDocument.tags || [{ id: "1", name: "FD-1", color: "#ef4444" }]
          );
          setPageScales(fullDocument.pageScales || {});
          setCallibrationScale(fullDocument.callibrationScale || {});
          setViewportDimensions(
            fullDocument.viewportDimensions || { width: 0, height: 0 }
          );

          // Load PDF from cloud URL if available
          if (fullDocument.fileUrl) {
            // Use proxy endpoint to bypass CORS issues
            const proxyUrl = `/api/proxy-pdf?url=${encodeURIComponent(
              fullDocument.fileUrl
            )}`;
            setFile(proxyUrl);
          }
        }
      } catch (error) {
        console.error("Error loading project from URL:", error);
      }
    };

    loadProjectFromUrl();
  }, [companyId, projectId, user]);

  // Auto-save functionality (only if we have valid company and project IDs)
  const { forceSave } = useAutoSaveFixtures({
    document: currentDocument,
    fixtures,
    tags,
    pageScales,
    callibrationScale,
    viewportDimensions,
    onDocumentUpdate: setCurrentDocument,
    companyId: companyId || "",
    projectId: projectId || "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  // const [pageInView, setPageInView] = useState(1);

  const onResize = useCallback<ResizeObserverCallback>((entries) => {
    const [entry] = entries;
    if (entry) setContainerWidth(entry.contentRect.width);
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver(onResize);
      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, [onResize]);

  const handleNewTakeoff = () => {
    setUploadDialogOpen(true);
  };

  const handleFileSelect = (selectedFile: File | string) => {
    setFile(selectedFile);
    setNumPages(undefined);
    setFixtures([]);
    setPageScales({});
    setCallibrationScale({});
    setHistory([]);
    setRedoStack([]);
    setPinnedIds(new Set());
    setCurrentDocument(null);
  };

  const handleNewFixture = async (
    projectName: string,
    fileName: string,
    file: File,
    onProgress?: (
      step:
        | "creating-project"
        | "uploading-file"
        | "creating-document"
        | "complete"
        | "error",
      progress: number
    ) => void
  ) => {
    if (!user || !companyId) return;

    try {
      // Step 1: Create project in Firestore
      onProgress?.("creating-project", 20);
      const currentProjectId = "project-" + Date.now();
      await setDoc(
        doc(db, "companies", companyId, "projects", currentProjectId),
        {
          name: projectName,
          description: `Project for ${fileName}`,
          status: "active",
          createdAt: new Date().toISOString(),
          createdBy: user.uid,
        }
      );
      setProjectId(currentProjectId);

      // Navigate to fixture counter with the new project
      router.push(
        `/fixture-counter?companyId=${companyId}&projectId=${currentProjectId}`
      );

      // Step 2: Check storage availability before uploading
      onProgress?.("uploading-file", 40);
      const { checkStorageAvailability, increaseStorageUsage, formatBytes } =
        await import("@/lib/services/storageService");
      const storageCheck = await checkStorageAvailability(companyId, file.size);

      if (!storageCheck.available) {
        throw new Error(
          `Storage limit exceeded. Available: ${formatBytes(
            storageCheck.availableBytes
          )}, Required: ${formatBytes(file.size)}`
        );
      }

      // Step 3: Upload file to Cloudflare R2
      onProgress?.("uploading-file", 50);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("companyId", companyId);
      formData.append("projectId", currentProjectId);

      const uploadResponse = await fetch("/api/upload-file", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        let errorData: any = {};
        try {
          errorData = await uploadResponse.json();
        } catch (e) {
          // If response is not JSON, try to get text
          const text = await uploadResponse.text().catch(() => "");
          errorData = { error: text || "Unknown error" };
        }

        throw new Error(
          errorData.error ||
            errorData.message ||
            "Failed to upload file to cloud storage"
        );
      }

      const { fileUrl, fileSize } = await uploadResponse.json();

      // Step 4: Update storage usage after successful upload
      await increaseStorageUsage(companyId, file.size);

      // Step 5: Create fixture document
      onProgress?.("creating-document", 80);
      const documentId = await createFixtureDocument(
        companyId,
        currentProjectId,
        {
          name: fileName.replace(/\.pdf$/i, ""),
          fileName,
          fileUrl,
          fileSize,
          userId: user.uid,
        }
      );

      const newDocument: FixtureDocument = {
        id: documentId,
        name: fileName.replace(/\.pdf$/i, ""),
        fileName,
        fileUrl,
        fileSize,
        fixtures: [],
        tags: [],
        pageScales: {},
        callibrationScale: {},
        viewportDimensions: { width: 0, height: 0 },
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: user.uid,
      };

      setCurrentDocument(newDocument);

      // Step 6: Complete
      onProgress?.("complete", 100);

      // Set the file URL so the PDF viewer can load it
      // Use proxy endpoint to bypass CORS issues
      const proxyUrl = `/api/proxy-pdf?url=${encodeURIComponent(fileUrl)}`;
      setFile(proxyUrl);
    } catch (error: any) {
      console.error("Error creating new fixture document:", error);
      onProgress?.("error", 0);
      throw error; // Re-throw so dialog can handle it
    }
  };

  const handleExistingProjectSelect = async (project: any) => {
    // When user selects an existing project, update the URL with the project ID
    setProjectId(project.id);
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set("projectId", project.id);
    router.replace(newUrl.pathname + newUrl.search);

    // Reset the current document state
    setCurrentDocument(null);
    setFixtures([]);
    setTags([{ id: "1", name: "FD-1", color: "#ef4444" }]);
    setPageScales({});
    setCallibrationScale({});
    setViewportDimensions({ width: 0, height: 0 });
    setHistory([]);
    setRedoStack([]);
    setPinnedIds(new Set());

    // Load existing fixture documents from this project
    try {
      let docs = await getProjectFixtureDocuments(companyId, project.id);
      let fullDocument: FixtureDocument | null = null;

      if (docs.length > 0) {
        // Load the most recent fixture document
        const latestDoc = docs[0];
        fullDocument = await getFixtureDocument(
          companyId,
          project.id,
          latestDoc.id
        );
      } else {
        // If no fixture documents exist, check for measurement documents
        // and use their fileUrl to load the PDF (user can start marking fixtures)
        const measurementDocs = await getProjectMeasurementDocuments(
          companyId,
          project.id
        );
        if (measurementDocs.length > 0) {
          const latestMeasurementDoc = measurementDocs[0];
          const measurementDocument = await getMeasurementDocument(
            companyId,
            project.id,
            latestMeasurementDoc.id
          );
          if (measurementDocument && measurementDocument.fileUrl) {
            // Create a new fixture document using the measurement document's file info
            const fixtureDocId = await createFixtureDocument(
              companyId,
              project.id,
              {
                name: measurementDocument.name + " (Fixtures)",
                fileName: measurementDocument.fileName,
                fileUrl: measurementDocument.fileUrl,
                fileSize: measurementDocument.fileSize,
                userId: measurementDocument.userId,
              }
            );

            // Load the newly created fixture document
            const newFixtureDocument = await getFixtureDocument(
              companyId,
              project.id,
              fixtureDocId
            );

            if (newFixtureDocument) {
              setCurrentDocument(newFixtureDocument);
              setFixtures([]);
              setTags([{ id: "1", name: "FD-1", color: "#ef4444" }]);
              setPageScales(measurementDocument.pageScales || {});
              setCallibrationScale(measurementDocument.callibrationScale || {});
              setViewportDimensions(
                measurementDocument.viewportDimensions || {
                  width: 0,
                  height: 0,
                }
              );

              // Load PDF from cloud URL
              const proxyUrl = `/api/proxy-pdf?url=${encodeURIComponent(
                measurementDocument.fileUrl
              )}`;
              setFile(proxyUrl);
            }
          }
          return; // Exit early
        }
      }

      if (fullDocument) {
        setCurrentDocument(fullDocument);
        setFixtures(fullDocument.fixtures || []);
        setTags(
          fullDocument.tags || [{ id: "1", name: "FD-1", color: "#ef4444" }]
        );
        setPageScales(fullDocument.pageScales || {});
        setCallibrationScale(fullDocument.callibrationScale || {});
        setViewportDimensions(
          fullDocument.viewportDimensions || { width: 0, height: 0 }
        );

        // Load PDF from cloud URL if available
        if (fullDocument.fileUrl) {
          // Use proxy endpoint to bypass CORS issues
          const proxyUrl = `/api/proxy-pdf?url=${encodeURIComponent(
            fullDocument.fileUrl
          )}`;
          setFile(proxyUrl);
        }
      }
    } catch (error) {
      console.error("Error loading existing fixtures:", error);
    }
  };

  function onDocumentLoadSuccess({ numPages: nextNumPages }: any) {
    setNumPages(nextNumPages);
  }

  const handleDoubleClick = (
    e: React.MouseEvent<HTMLDivElement>,
    pageNumber: number
  ) => {
    // Only create fixture if a tag is selected
    if (!selectedTag) return;

    const scale = pageScales[pageNumber] ?? 1.25;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    const newFixture: Fixture = {
      id: Date.now(),
      point: { x, y, page: pageNumber },
      page: pageNumber,
      tag: selectedTag,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedFixtures = [...fixtures, newFixture];
    setFixtures(updatedFixtures);
    setHistory((prev) => [...prev, fixtures]);
    setRedoStack([]);
  };

  const handleFixturePositionUpdate = (fixtureId: number, newPoint: Point) => {
    setFixtures((prev) =>
      prev.map((f) =>
        f.id === fixtureId
          ? { ...f, point: newPoint, updatedAt: new Date() }
          : f
      )
    );
  };

  // Track current page as user scrolls and a more precise page-in-view
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const children = container.querySelectorAll("[data-page-number]");
    // let closestPage = currentPage;
    // let minDistance = Infinity;

    // children.forEach((child) => {
    //   const rect = (child as HTMLElement).getBoundingClientRect();
    //   // Distance from top of container
    //   const distance = Math.abs(
    //     rect.top - container.getBoundingClientRect().top
    //   );
    //   if (distance < minDistance) {
    //     minDistance = distance;
    //     const pageNum = parseInt(
    //       (child as HTMLElement).getAttribute("data-page-number") || "1",
    //       10
    //     );
    //     closestPage = pageNum;
    //   }
    // });

    // if (closestPage !== currentPage) {
    //   setCurrentPage(closestPage);
    // }

    // More precise page-in-view calculation
    let newCurrentPage = currentPage;

    children.forEach((child) => {
      const rect = (child as HTMLElement).getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const pageNum = parseInt(
        (child as HTMLElement).getAttribute("data-page-number") || "1",
        10
      );

      // Page fully visible in container
      const fullyVisible =
        rect.top >= containerRect.top && rect.bottom <= containerRect.bottom;

      // Page is "current in-view" when:
      // 1. It's fully visible (normal forward scroll), OR
      // 2. Its bottom is inside the container (handles scrolling back up)
      const candidate =
        fullyVisible ||
        (rect.top < containerRect.top && rect.bottom > containerRect.top);

      if (candidate) {
        if (pageNum !== newCurrentPage) {
          newCurrentPage = pageNum;
        }
      }
    });

    if (newCurrentPage !== currentPage) {
      setCurrentPage(newCurrentPage);
    }
  }, [currentPage]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !file) return; // Only attach scroll listener when file is loaded
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll, file]);

  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setRedoStack((r) => [fixtures, ...r]);
    setFixtures(prev);
    setHistory((h) => h.slice(0, h.length - 1));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[0];
    setFixtures(next);
    setHistory((h) => [...h, fixtures]);
    setRedoStack((r) => r.slice(1));
  };

  const handleTagCreate = (newTag: Tag) => {
    setTags((prev) => [...prev, newTag]);
    setSelectedTag(newTag);
  };

  const handleTagDelete = (tagId: string) => {
    setTags((prev) => prev.filter((tag) => tag.id !== tagId));
    if (selectedTag?.id === tagId) {
      setSelectedTag(null);
    }
  };

  const handleFixtureTagChange = (fixtureId: number, tag: Tag | null) => {
    setFixtures((prev) =>
      prev.map((f) =>
        f.id === fixtureId
          ? { ...f, tag: tag || undefined, updatedAt: new Date() }
          : f
      )
    );
  };

  const handleTogglePin = (fixtureId: number) => {
    setPinnedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(fixtureId)) {
        newSet.delete(fixtureId);
      } else {
        newSet.add(fixtureId);
      }
      return newSet;
    });
  };

  const handleDeleteFixture = (fixtureId: number) => {
    // Remove from pinned fixtures
    setPinnedIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(fixtureId);
      return newSet;
    });

    // Remove from fixtures
    setFixtures((prev) => prev.filter((f) => f.id !== fixtureId));

    // Update history for undo/redo
    setHistory((prev) => [...prev, fixtures]);
    setRedoStack([]);
  };

  const handleDocumentUpdate = (
    updatedDocument: FixtureDocument | MeasurementDocument
  ) => {
    // In fixture counter context, it will always be FixtureDocument
    setCurrentDocument(updatedDocument as FixtureDocument);
  };

  const handleClearAllFixtures = async () => {
    if (!currentDocument || !companyId || !projectId) return;

    try {
      // Clear all fixtures from state
      setFixtures([]);
      setHistory([]);
      setRedoStack([]);
      setPinnedIds(new Set());

      // Update document in database
      await updateFixtureDocument(companyId, projectId, currentDocument.id, {
        fixtures: [],
      });

      // Update local document state
      const updatedDocument: FixtureDocument = {
        ...currentDocument,
        fixtures: [],
        updatedAt: new Date(),
      };
      setCurrentDocument(updatedDocument);

      // Close dialog
      setClearFixturesDialogOpen(false);
    } catch (error) {
      console.error("Error clearing fixtures:", error);
    }
  };

  // Show loading message while getting user data
  if (!companyId && user) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Fixture Counter</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Loading your data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fixture Counter</h1>
          <p className="text-muted-foreground">
            Upload PDF drawings and mark fixture locations to count different
            types of fixtures.
          </p>
        </div>
      </div>

      {/* Document Manager */}
      {currentDocument && (
        <div className="mb-4">
          <DocumentManager
            document={currentDocument}
            onDocumentUpdate={handleDocumentUpdate}
            companyId={companyId}
            projectId={projectId}
          >
            <DocumentActions
              document={currentDocument}
              measurementCount={fixtures.length}
              onClearAll={() => setClearFixturesDialogOpen(true)}
            />
          </DocumentManager>
        </div>
      )}

      {/* Clear All Fixtures Confirmation Dialog */}
      <ClearAllFixturesDialog
        open={clearFixturesDialogOpen}
        onOpenChange={setClearFixturesDialogOpen}
        onConfirm={handleClearAllFixtures}
        fixtureCount={fixtures.length}
      />

      {/* File Upload Dialog */}
      <FileUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onFileSelect={handleFileSelect}
        onProjectSelect={handleExistingProjectSelect}
        onNewProject={(
          projectName: string,
          fileName: string,
          file: File,
          onProgress?: (
            step:
              | "creating-project"
              | "uploading-file"
              | "creating-document"
              | "complete"
              | "error",
            progress: number
          ) => void
        ) => handleNewFixture(projectName, fileName, file, onProgress)}
        companyId={companyId}
      />

      {/* Tag Selector - Only show when file is loaded */}
      {file && (
        <div className="mb-4">
          <TagSelector
            tags={tags}
            selectedTag={selectedTag}
            onTagSelect={setSelectedTag}
            onTagCreate={handleTagCreate}
            onTagDelete={handleTagDelete}
          />
        </div>
      )}

      {/* ✅ Sticky toolbar for the current page - Only show when file is loaded */}
      {file && (
        <div className="sticky top-0 left-0 right-0 z-[1] flex items-center justify-between px-4 py-2 border border-border bg-muted/50 rounded-t-lg rounded-b-none">
          <span className="text-xs text-muted-foreground">
            Page {currentPage}
          </span>
          <div className="flex items-center gap-2">
            {/* Undo/Redo Buttons */}
            <button
              onClick={handleUndo}
              disabled={history.length === 0}
              className="p-1 rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed text-foreground"
              title="Undo"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="p-1 rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed text-foreground"
              title="Redo"
            >
              <Redo className="w-4 h-4" />
            </button>

            <div className="w-px h-4 bg-border mx-1"></div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                Scale:
              </span>
              <DrawingCallibrationScale
                scaleMode={scaleMode}
                onScaleModeChange={(newMode) => {
                  setScaleMode(newMode);
                  // When switching to universal mode, sync all pages to current page's scale
                  if (newMode === "universal" && numPages) {
                    const currentScale =
                      callibrationScale[currentPage] ||
                      DEFAULT_CALLIBRATION_VALUE;
                    const newCallibrationScales: { [page: number]: string } =
                      {};
                    for (let i = 1; i <= numPages; i++) {
                      newCallibrationScales[i] = currentScale;
                    }
                    setCallibrationScale(newCallibrationScales);
                  }
                }}
                setCallibrationScale={(newCallibrationScale: string) => {
                  if (scaleMode === "universal" && numPages) {
                    // Update all pages
                    const newCallibrationScales: { [page: number]: string } =
                      {};
                    for (let i = 1; i <= numPages; i++) {
                      newCallibrationScales[i] = newCallibrationScale;
                    }
                    setCallibrationScale(newCallibrationScales);
                  } else {
                    // Update current page only
                    setCallibrationScale((prev) => ({
                      ...prev,
                      [currentPage]: newCallibrationScale,
                    }));
                  }
                }}
                callibrationScale={callibrationScale[currentPage]}
              />
            </div>
            <div className="flex items-center gap-2 px-2 py-1 bg-background/50 rounded-md border border-border">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                Zoom:
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    const currentScale = pageScales[currentPage] ?? 1.25;
                    const newScale = Math.max(1, currentScale - 0.25);
                    setPageScales((prev) => ({
                      ...prev,
                      [currentPage]: newScale,
                    }));
                  }}
                  disabled={(pageScales[currentPage] ?? 1.25) <= 1}
                  className="p-1 rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Zoom out"
                  aria-label="Zoom out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center gap-2 min-w-[120px]">
                  <Slider
                    min={1}
                    max={10}
                    step={0.05}
                    value={[pageScales[currentPage] ?? 1.25]}
                    onValueChange={([val]) =>
                      setPageScales((prev) => ({
                        ...prev,
                        [currentPage]: val,
                      }))
                    }
                    className="w-full"
                    aria-label={`Zoom for page ${currentPage}`}
                  />
                  <span className="text-xs font-medium text-foreground min-w-[3rem] text-right">
                    {Math.round((pageScales[currentPage] ?? 1.25) * 100)}%
                  </span>
                </div>
                <button
                  onClick={() => {
                    const currentScale = pageScales[currentPage] ?? 1.25;
                    const newScale = Math.min(10, currentScale + 0.25);
                    setPageScales((prev) => ({
                      ...prev,
                      [currentPage]: newScale,
                    }));
                  }}
                  disabled={(pageScales[currentPage] ?? 1.25) >= 10}
                  className="p-1 rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Zoom in"
                  aria-label="Zoom in"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    setPageScales((prev) => ({
                      ...prev,
                      [currentPage]: 1.25,
                    }));
                  }}
                  className="p-1 rounded hover:bg-accent transition-colors"
                  title="Reset zoom to default"
                  aria-label="Reset zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {file && (
        <div className="relative max-w-[100%] max-h-[100vh] ">
          <TakeoffControlMenu
            scale={pageScales[currentPage] ?? 1.25}
            setScale={(newScale: number) =>
              setPageScales((prev) => ({ ...prev, [currentPage]: newScale }))
            }
            pinnedCount={pinnedIds.size}
            onClearAllPins={() => setPinnedIds(new Set())}
            currentPage={currentPage}
            totalPages={numPages || 0}
          />
          <div className="absolute bottom-8 left-6 z-[1] gap-2 flex px-2 py-1 items-center justify-center rounded-md shadow backdrop-blur supports-[backdrop-filter]:bg-primary/40 opacity-90 hover:opacity-100 transition-opacity">
            <span className="text-primary text-xs">{`${viewportDimensions.width}" x ${viewportDimensions.height}"`}</span>
          </div>
          <div
            className="max-w-[100%] max-h-[100vh] overflow-auto"
            ref={containerRef}
          >
            {/* PDF Document */}
            <Document
              file={file}
              onLoadSuccess={onDocumentLoadSuccess}
              options={options}
            >
              {Array.from(new Array(numPages), (_, index) => {
                const pageNumber = index + 1;
                const isVisible = Math.abs(pageNumber - currentPage) <= 3;
                const scale = pageScales[pageNumber] ?? 1.25;

                return (
                  <div
                    key={`page_container_${pageNumber}`}
                    className="relative overflow-x-auto mb-6"
                  >
                    <div
                      key={`pdf_page_${pageNumber}`}
                      className="relative border border-t-0 shadow-sm"
                      data-page-number={pageNumber}
                      onDoubleClick={(e) => handleDoubleClick(e, pageNumber)}
                    >
                      {isVisible && (
                        <>
                          <Page
                            pageNumber={pageNumber}
                            scale={scale}
                            width={
                              containerWidth
                                ? Math.min(containerWidth, maxWidth)
                                : maxWidth
                            }
                            renderAnnotationLayer={false}
                            renderTextLayer={false}
                            onRenderSuccess={(page) => {
                              page.cleanup();
                              setPagesWidth((prev) => ({
                                ...prev,
                                [pageNumber]: Math.max(page.width, page.height),
                              }));
                              const viewport = page.getViewport({ scale: 1 });
                              setViewportDimensions({
                                width: Number((viewport.width / 72).toFixed(0)),
                                height: Number(
                                  (viewport.height / 72).toFixed(0)
                                ),
                              });
                            }}
                          />
                          <FixtureOverlay
                            pageNumber={pageNumber}
                            fixtures={fixtures}
                            scale={scale}
                            hoveredId={hoveredId}
                            pinnedIds={pinnedIds}
                            setHoveredId={setHoveredId}
                            onTogglePin={handleTogglePin}
                            onTagChange={handleFixtureTagChange}
                            onDeleteFixture={handleDeleteFixture}
                            onPositionUpdate={handleFixturePositionUpdate}
                            tags={tags}
                            pageWidth={pagesWidth[pageNumber] || 0}
                          />
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </Document>
          </div>
        </div>
      )}

      {/* Empty State - Only show when no file is loaded */}
      {!file && (
        <div>
          <Card className="rounded-lg">
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
                <div className="w-20 h-20 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
                  <FileText className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  No Fixture Counter Project Loaded
                </h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Start a new fixture counting project by uploading a PDF
                  drawing. You can mark fixture locations or continue with
                  existing ones.
                </p>
                <Button onClick={handleNewTakeoff} size="lg" className="px-6">
                  <Upload className="w-4 h-4 mr-2" />
                  Start New Fixture Counter
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {file && (
        <div className="mt-6">
          {fixtures.length > 0 && (
            <FixtureSummary fixtures={fixtures} tags={tags} />
          )}
        </div>
      )}
    </div>
  );
}
