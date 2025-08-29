"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { pdfjs, Document, Page } from "react-pdf";
import { Upload, FileText } from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { TakeoffControlMenu } from "@/components/takeoff-calculator/control-menu";
import { DrawingCallibrationScale } from "@/components/takeoff-calculator/callibration-scale";
import { MeasurementOverlay } from "@/components/takeoff-calculator/measurement-overlay";
import { MeasurementList } from "@/components/takeoff-calculator/measurement-list";
import { TagSelector, Tag } from "@/components/takeoff-calculator/tag-selector";
import { MeasurementSummary } from "@/components/takeoff-calculator/measurement-summary";
import {
  DEFAULT_CALLIBRATION_VALUE,
  DrawingCalibrations,
} from "@/lib/drawingCallibrations";

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

interface Point {
  x: number;
  y: number;
  page: number;
}

interface Measurement {
  id: number;
  points: [Point, Point];
  pixelDistance: number;
  tag?: {
    id: string;
    name: string;
    color: string;
  };
}

const maxWidth = 800;

export default function PDFViewer() {
  const containerRef = useRef<HTMLDivElement>(null);

  const [file, setFile] = useState<PDFFile>(
    "/Level1 Floor Plan - Hydronic.pdf"
  );
  const [numPages, setNumPages] = useState<number>();
  const [scale, setScale] = useState(1.25); // This the zoom level, 1.25 is 125%
  const [containerWidth, setContainerWidth] = useState<number>();
  const [pdfWidth, setPdfWidth] = useState<number>(0);
  const [scaleFactor, setScaleFactor] = useState<number | null>(
    DrawingCalibrations[DEFAULT_CALLIBRATION_VALUE]
  ); // Scale factor for converting pixels to meters
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

  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [pinnedIds, setPinnedIds] = useState<Set<number>>(new Set());

  // Tag state
  const [tags, setTags] = useState<Tag[]>([
    { id: "1", name: "10mm", color: "#ef4444" },
    { id: "2", name: "20mm", color: "#3b82f6" },
    { id: "3", name: "30mm", color: "#22c55e" },
  ]);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [dragEnd, setDragEnd] = useState<Point | null>(null);
  const [dragPage, setDragPage] = useState<number | null>(null);

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

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;
    setFile(nextFile);
    setNumPages(undefined);
    setMeasurements([]);
    setScaleFactor(null);
    setHistory([]);
    setRedoStack([]);
    setPinnedIds(new Set());
  }

  function onDocumentLoadSuccess({ numPages: nextNumPages }: any) {
    setNumPages(nextNumPages);
  }

  const handleMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    pageNumber: number
  ) => {
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

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const pixelDistance = Math.sqrt(dx ** 2 + dy ** 2);

    const newMeasurement: Measurement = {
      id: Date.now(),
      points: [p1, p2],
      pixelDistance,
      tag: selectedTag || undefined,
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
        m.id === measurementId ? { ...m, tag: tag || undefined } : m
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

  return (
    <div className="">
      <h2 className="text-gray-500">Take-off Calculator</h2>

      <div className="flex justify-between items-center flex-wrap gap-4 my-4">
        {/* Left: File Info */}
        <div className="flex gap-2 items-center text-muted-foreground">
          <FileText />
          {typeof file === "string"
            ? file.split("/").pop()
            : file?.name ?? "No file selected"}
        </div>

        {/* Right: Upload + Scale Selector */}
        <div className="flex items-center gap-2">
          {/* Upload Button */}
          <label className="flex h-9 items-center px-4 py-2 bg-primary text-white text-sm font-medium rounded-md cursor-pointer hover:bg-primary/90 transition-colors">
            <Upload className="w-4 h-4 mr-2" />
            Upload PDF
            <input
              type="file"
              accept="application/pdf"
              onChange={onFileChange}
              className="hidden"
            />
          </label>

          <DrawingCallibrationScale setScaleFactor={setScaleFactor} />
        </div>
      </div>

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

      {file && (
        <div className="relative max-w-[100%] max-h-[100vh] ">
          <TakeoffControlMenu
            scale={scale}
            setScale={setScale}
            handleRedo={handleRedo}
            handleUndo={handleUndo}
            pinnedCount={pinnedIds.size}
            onClearAllPins={() => setPinnedIds(new Set())}
          />
          <div className="absolute bottom-8 left-6 z-[1] gap-2 flex px-2 py-1 items-center justify-center rounded-md shadow backdrop-blur supports-[backdrop-filter]:bg-primary/40 opacity-90 hover:opacity-100 transition-opacity">
            <span className="text-primary text-xs">{`${viewportDimensions.width}" x ${viewportDimensions.height}"`}</span>
          </div>
          <div
            className="max-w-[100%] max-h-[100vh] overflow-auto"
            ref={containerRef}
          >
            <Document
              file={file}
              onLoadSuccess={onDocumentLoadSuccess}
              options={options}
            >
              {Array.from(new Array(numPages), (_, index) => (
                <div
                  key={`pdf_page_${index + 1}`}
                  className="relative mb-6 border"
                  onMouseDown={(e) => handleMouseDown(e, index + 1)}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                >
                  <Page
                    pageNumber={index + 1}
                    scale={scale}
                    width={
                      containerWidth
                        ? Math.min(containerWidth, maxWidth)
                        : maxWidth
                    }
                    renderAnnotationLayer={false}
                    renderTextLayer={false}
                    onRenderSuccess={(page) => {
                      setPdfWidth(page.height); // By debugging, we can see the height of the PDF page is the correct measurement for canvas width
                      const viewport = page.getViewport({ scale: 1 });
                      setViewportDimensions({
                        width: Number((viewport.width / 72).toFixed(0)),
                        height: Number((viewport.height / 72).toFixed(0)),
                      });
                    }}
                  />

                  <MeasurementOverlay
                    pageNumber={index + 1}
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
                    pdfWidth={pdfWidth}
                  />
                </div>
              ))}
            </Document>
          </div>
        </div>
      )}

      <div className="mt-6">
        {measurements.length > 0 && (
          <>
            <MeasurementList
              measurements={measurements}
              scaleFactor={scaleFactor}
              tags={tags}
              onMeasurementTagChange={handleMeasurementTagChange}
            />
            <MeasurementSummary
              measurements={measurements}
              scaleFactor={scaleFactor}
              tags={tags}
            />
          </>
        )}
      </div>
    </div>
  );
}
