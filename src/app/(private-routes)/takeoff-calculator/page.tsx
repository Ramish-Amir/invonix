"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { pdfjs, Document, Page } from "react-pdf";
import { Upload, FileText, Save, Info } from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { TakeoffControlMenu } from "@/components/takeoff-calculator/control-menu";
import { DrawingCallibrationScale } from "@/components/takeoff-calculator/callibration-scale";
import { MeasurementOverlay } from "@/components/takeoff-calculator/measurement-overlay";
import { TagSelector, Tag } from "@/components/takeoff-calculator/tag-selector";
import { MeasurementSummary } from "@/components/takeoff-calculator/measurement-summary";
import { FileUploadDialog } from "@/components/takeoff-calculator/file-upload-dialog";
import {
  DocumentManager,
  DocumentInfoDialog,
} from "@/components/takeoff-calculator/document-manager";
import { Button } from "@/components/ui/button";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useAuth } from "@/hooks/useAuth";
import {
  DEFAULT_CALLIBRATION_VALUE,
  DrawingCalibrations,
  getDrawingCallibrations,
} from "@/lib/drawingCallibrations";
import {
  MeasurementDocument,
  Measurement,
  Point,
} from "@/lib/types/measurement";
import {
  createMeasurementDocument,
  getMeasurementDocument,
} from "@/lib/services/measurementService";

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

export default function PDFViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const [file, setFile] = useState<PDFFile>("/sample.pdf");
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
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [history, setHistory] = useState<Measurement[][]>([]);
  const [redoStack, setRedoStack] = useState<Measurement[][]>([]);

  // Document management state
  const [currentDocument, setCurrentDocument] =
    useState<MeasurementDocument | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [pinnedIds, setPinnedIds] = useState<Set<number>>(new Set());

  // Tag state
  const [tags, setTags] = useState<Tag[]>([
    { id: "1", name: "65", color: "#ef4444" },
  ]);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(tags[0]);

  // Auto-save functionality
  const { forceSave } = useAutoSave({
    document: currentDocument,
    measurements,
    tags,
    pageScales,
    callibrationScale,
    viewportDimensions,
    onDocumentUpdate: setCurrentDocument,
  });

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [dragEnd, setDragEnd] = useState<Point | null>(null);
  const [dragPage, setDragPage] = useState<number | null>(null);

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

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setNumPages(undefined);
    setMeasurements([]);
    setPageScales({});
    setCallibrationScale({});
    setHistory([]);
    setRedoStack([]);
    setPinnedIds(new Set());
    setCurrentDocument(null);
  };

  const handleNewMeasurement = async (fileName: string) => {
    if (!user) return;

    try {
      const documentId = await createMeasurementDocument({
        name: fileName.replace(/\.pdf$/i, ""),
        fileName,
        userId: user.uid,
      });

      const newDocument: MeasurementDocument = {
        id: documentId,
        name: fileName.replace(/\.pdf$/i, ""),
        fileName,
        measurements: [],
        tags: [],
        pageScales: {},
        callibrationScale: {},
        viewportDimensions: { width: 0, height: 0 },
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: user.uid,
      };

      setCurrentDocument(newDocument);
    } catch (error) {
      console.error("Error creating new measurement document:", error);
    }
  };

  const handleExistingMeasurementSelect = async (
    document: MeasurementDocument
  ) => {
    try {
      const fullDocument = await getMeasurementDocument(document.id);
      if (fullDocument) {
        setCurrentDocument(fullDocument);
        setMeasurements(fullDocument.measurements);
        setTags(fullDocument.tags);
        setPageScales(fullDocument.pageScales);
        setCallibrationScale(fullDocument.callibrationScale);
        setViewportDimensions(fullDocument.viewportDimensions);
        setHistory([]);
        setRedoStack([]);
        setPinnedIds(new Set());
      }
    } catch (error) {
      console.error("Error loading existing measurement document:", error);
    }
  };

  function onDocumentLoadSuccess({ numPages: nextNumPages }: any) {
    setNumPages(nextNumPages);
  }

  const handleMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    pageNumber: number
  ) => {
    const scale = pageScales[pageNumber] ?? 1.25;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    setDragStart({ x, y, page: pageNumber });
    setDragEnd(null);
    setDragPage(pageNumber);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStart || dragPage === null) return;
    const scale = pageScales[dragPage] ?? 1.25;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    setDragEnd({ x, y, page: dragPage });
  };

  const handleMouseUp = () => {
    if (!isDragging || !dragStart || !dragEnd) {
      setIsDragging(false);
      return;
    }

    const p1 = dragStart;
    const p2 = dragEnd;
    const pageNum = dragPage ?? 1;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const pixelDistance = Math.sqrt(dx ** 2 + dy ** 2);

    const newMeasurement: Measurement = {
      id: Date.now(),
      points: [p1, p2],
      pixelDistance,
      tag: selectedTag || undefined,
      page: pageNum,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedMeasurements = [...measurements, newMeasurement];
    setMeasurements(updatedMeasurements);
    setHistory((prev) => [...prev, measurements]);
    setRedoStack([]);

    // Reset drag state
    setDragStart(null);
    setDragEnd(null);
    setDragPage(null);
    setIsDragging(false);
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
    if (!el) return;
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setRedoStack((r) => [measurements, ...r]);
    setMeasurements(prev);
    setHistory((h) => h.slice(0, h.length - 1));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[0];
    setMeasurements(next);
    setHistory((h) => [...h, measurements]);
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

  const handleMeasurementTagChange = (
    measurementId: number,
    tag: Tag | null
  ) => {
    setMeasurements((prev) =>
      prev.map((m) =>
        m.id === measurementId
          ? { ...m, tag: tag || undefined, updatedAt: new Date() }
          : m
      )
    );
  };

  const handleTogglePin = (measurementId: number) => {
    setPinnedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(measurementId)) {
        newSet.delete(measurementId);
      } else {
        newSet.add(measurementId);
      }
      return newSet;
    });
  };

  const handleDeleteMeasurement = (measurementId: number) => {
    // Remove from pinned measurements
    setPinnedIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(measurementId);
      return newSet;
    });

    // Remove from measurements
    setMeasurements((prev) => prev.filter((m) => m.id !== measurementId));

    // Update history for undo/redo
    setHistory((prev) => [...prev, measurements]);
    setRedoStack([]);
  };

  const handleDocumentUpdate = (updatedDocument: MeasurementDocument) => {
    setCurrentDocument(updatedDocument);
  };

  return (
    <div className="">
      <h2 className="text-gray-500">Take-off Calculator</h2>

      {/* Document Manager */}
      {currentDocument && (
        <div className="mb-4">
          <DocumentManager
            document={currentDocument}
            onDocumentUpdate={handleDocumentUpdate}
          >
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={forceSave}
                className="h-8"
              >
                <Save className="w-3 h-3 mr-1" />
                Save
              </Button>
              <DocumentInfoDialog document={currentDocument}>
                <Button size="sm" variant="outline" className="h-8">
                  <Info className="w-3 h-3" />
                </Button>
              </DocumentInfoDialog>
            </div>
          </DocumentManager>
        </div>
      )}

      <div className="flex justify-between items-center flex-wrap gap-4 my-4">
        {/* Left: File Info */}
        <div className="flex gap-2 items-center text-muted-foreground">
          <FileText />
          {typeof file === "string"
            ? file.split("/").pop()
            : file?.name ?? "No file selected"}
        </div>

        {/* Right: New Take-off */}
        <div className="flex items-center gap-2">
          <Button onClick={handleNewTakeoff} className="h-9">
            <Upload className="w-4 h-4 mr-2" />
            New Take-off
          </Button>
        </div>
      </div>

      {/* File Upload Dialog */}
      <FileUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onFileSelect={handleFileSelect}
        onMeasurementSelect={handleExistingMeasurementSelect}
        onNewMeasurement={handleNewMeasurement}
      />

      {/* Tag Selector */}
      <div className="mb-4">
        <TagSelector
          tags={tags}
          selectedTag={selectedTag}
          onTagSelect={setSelectedTag}
          onTagCreate={handleTagCreate}
          onTagDelete={handleTagDelete}
        />
      </div>

      {/* ✅ Sticky toolbar for the current page */}
      <div className="sticky top-0 left-0 right-0 z-[1] flex items-center justify-between px-4 py-2 border bg-gray-50 rounded-t-lg rounded-b-none">
        <span className="text-xs text-gray-500">Page {currentPage}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Scale:</span>
          <DrawingCallibrationScale
            setCallibrationScale={(newCallibrationScale: string) =>
              setCallibrationScale((prev) => ({
                ...prev,
                [currentPage]: newCallibrationScale,
              }))
            }
            callibrationScale={callibrationScale[currentPage]}
          />
          <span className="text-xs text-gray-500">Zoom:</span>
          <input
            type="number"
            min={1}
            max={10}
            step={1}
            value={pageScales[currentPage] ?? 1.25}
            onChange={(e) =>
              setPageScales((prev) => ({
                ...prev,
                [currentPage]: Number(e.target.value),
              }))
            }
            className="w-16 px-2 py-1 border rounded text-xs"
            aria-label={`Zoom for page ${currentPage}`}
          />
        </div>
      </div>

      {file && (
        <div className="relative max-w-[100%] max-h-[100vh] ">
          <TakeoffControlMenu
            scale={pageScales[currentPage] ?? 1.25}
            setScale={(newScale: number) =>
              setPageScales((prev) => ({ ...prev, [currentPage]: newScale }))
            }
            handleRedo={handleRedo}
            handleUndo={handleUndo}
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
                const isVisible = Math.abs(pageNumber - currentPage) <= 1;
                const scale = pageScales[pageNumber] ?? 1.25;
                const scaleFactor =
                  getDrawingCallibrations(
                    callibrationScale[pageNumber]?.toString(),
                    viewportDimensions
                  ) ?? DrawingCalibrations[DEFAULT_CALLIBRATION_VALUE];

                return (
                  <div
                    key={`page_container_${pageNumber}`}
                    className="relative overflow-x-auto mb-6"
                  >
                    <div
                      key={`pdf_page_${pageNumber}`}
                      className="relative border border-t-0 shadow-sm"
                      data-page-number={pageNumber}
                      onMouseDown={(e) => handleMouseDown(e, pageNumber)}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
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
                          <MeasurementOverlay
                            pageNumber={pageNumber}
                            measurements={measurements}
                            scale={scale}
                            scaleFactor={scaleFactor}
                            hoveredId={hoveredId}
                            pinnedIds={pinnedIds}
                            isDragging={isDragging}
                            dragStart={dragStart}
                            dragEnd={dragEnd}
                            dragPage={dragPage}
                            setHoveredId={setHoveredId}
                            onTogglePin={handleTogglePin}
                            onTagChange={handleMeasurementTagChange}
                            onDeleteMeasurement={handleDeleteMeasurement}
                            tags={tags}
                            pageWidth={pagesWidth[pageNumber] || 0} // Changes for each page after every zoom-level update
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

      <div className="mt-6">
        {measurements.length > 0 && (
          <>
            <MeasurementSummary
              measurements={measurements}
              tags={tags}
              callibrationScale={callibrationScale}
              viewportDimensions={viewportDimensions}
            />
            {/* <MeasurementList
              measurements={measurements}
              // Pass per-measurement scaleFactor based on page
              scaleFactorGetter={(measurement) =>
                callibrationScale[measurement.points[0].page] ??
                DrawingCalibrations[DEFAULT_CALLIBRATION_VALUE]
              }
              tags={tags}
              onMeasurementTagChange={handleMeasurementTagChange}
            /> */}
          </>
        )}
      </div>
    </div>
  );
}
