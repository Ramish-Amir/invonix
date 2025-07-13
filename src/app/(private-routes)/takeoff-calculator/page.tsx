"use client";

// Import necessary React hooks and PDF rendering components
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { pdfjs, Document, Page } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Configure PDF.js worker source for client-side PDF rendering
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

// PDF.js options for font and map data
const options = {
  cMapUrl: "/cmaps/",
  standardFontDataUrl: "/standard_fonts/",
  wasmUrl: "/wasm/",
};

// Type for PDF file input
type PDFFile = string | File | null;

// Point type for marking coordinates on a PDF page
interface Point {
  x: number;
  y: number;
  page: number;
}

// Measurement type for storing distance between two points
interface Measurement {
  id: number;
  points: [Point, Point];
  pixelDistance: number;
  realDistance: number | null;
}

// Maximum width for PDF rendering container
const maxWidth = 800;

// Main component for PDF takeoff tool
export default function PDFViewer() {
  // Unique ID for file input
  const fileId = useId();

  // State for PDF file, number of pages, zoom scale, container width, calibration, etc.
  const [file, setFile] = useState<PDFFile>(null);
  const [numPages, setNumPages] = useState<number>();
  const [scale, setScale] = useState(1.25);
  const [containerWidth, setContainerWidth] = useState<number>();
  const [calibrating, setCalibrating] = useState(false);
  const [scaleFactor, setScaleFactor] = useState<number | null>(null);
  const [tempPoints, setTempPoints] = useState<Point[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);

  // Ref for the PDF container div
  const containerRef = useRef<HTMLDivElement>(null);

  // Callback for handling container resize and updating width
  const onResize = useCallback<ResizeObserverCallback>((entries) => {
    const [entry] = entries;
    if (entry) {
      setContainerWidth(entry.contentRect.width);
    }
  }, []);

  // Handler for file input change
  function onFileChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const nextFile = event.target.files?.[0] ?? null;
    setFile(nextFile); // Set selected PDF file
    setNumPages(undefined); // Reset number of pages
    setMeasurements([]); // Clear measurements
    setScaleFactor(null); // Reset calibration
    setTempPoints([]); // Clear temporary points
  }

  // Handler for successful PDF document load
  function onDocumentLoadSuccess({ numPages: nextNumPages }: any): void {
    setNumPages(nextNumPages); // Set number of pages in PDF
  }

  // Handler for clicking on a PDF page to mark measurement points
  function handleClick(
    e: React.MouseEvent<HTMLDivElement>,
    pageNumber: number
  ) {
    // Calculate click coordinates relative to PDF page and current scale
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    const nextPoints = [...tempPoints, { x, y, page: pageNumber }];
    setTempPoints(nextPoints);

    // If two points are marked, calculate distance
    if (nextPoints.length === 2) {
      const [p1, p2] = nextPoints;
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const pixelDistance = Math.sqrt(dx ** 2 + dy ** 2);
      let realDistance = null;

      // If calibrating, prompt user for real-world distance and set scale factor
      if (calibrating) {
        const input = prompt("Enter real-world distance in meters:");
        const meters = parseFloat(input || "0");
        if (!isNaN(meters) && meters > 0) {
          const sf = meters / pixelDistance;
          setScaleFactor(sf);
          alert(`Calibration complete: 1 px = ${sf.toFixed(4)} meters`);
        }
        setCalibrating(false);
        setTempPoints([]);
        return;
      }

      // If calibrated, calculate real-world distance
      if (scaleFactor) realDistance = pixelDistance * scaleFactor;

      // Store measurement in state
      setMeasurements((prev) => [
        ...prev,
        {
          id: Date.now(),
          points: [p1, p2],
          pixelDistance,
          realDistance,
        },
      ]);
      setTempPoints([]);
    }
  }

  // Render SVG overlay for measurements on a given page
  const renderOverlay = (pageNumber: number) => {
    // Filter measurements for the current page
    const pageMeasurements = measurements.filter(
      (m) => m.points[0].page === pageNumber && m.points[1].page === pageNumber
    );

    return (
      <svg
        className="absolute top-0 left-0 pointer-events-none"
        width="100%"
        height="100%"
      >
        {/* Draw lines for each measurement */}
        {pageMeasurements.map((m) => (
          <line
            key={m.id}
            x1={m.points[0].x * scale}
            y1={m.points[0].y * scale}
            x2={m.points[1].x * scale}
            y2={m.points[1].y * scale}
            stroke="red"
            strokeWidth={4}
            opacity={0.4}
          />
        ))}
      </svg>
    );
  };

  // Main render
  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Title */}
      <h1 className="text-2xl font-bold mb-4">📏 PDF Takeoff Tool</h1>

      {/* PDF file upload input */}
      <label htmlFor={fileId}>Upload a PDF:</label>
      <input
        id={fileId}
        onChange={onFileChange}
        type="file"
        accept="application/pdf"
        className="mb-4"
      />

      {/* Controls for zoom and calibration */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setScale((s) => s + 0.25)}>Zoom In</button>
        <button onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}>
          Zoom Out
        </button>
        <button onClick={() => setCalibrating(true)}>Calibrate</button>
      </div>

      {/* PDF rendering and measurement overlay */}
      {file && (
        <div ref={containerRef}>
          <Document
            file={file}
            onLoadSuccess={onDocumentLoadSuccess}
            options={options}
          >
            {/* Render each page of the PDF */}
            {Array.from(new Array(numPages), (_, index) => (
              <div
                key={`pdf_page_${index + 1}`}
                className="relative mb-6 border"
                onClick={(e) => handleClick(e, index + 1)}
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
                />
                {/* Overlay for measurements */}
                {renderOverlay(index + 1)}
              </div>
            ))}
          </Document>
        </div>
      )}

      {/* Calibration and measurements summary */}
      <div className="mt-6">
        {scaleFactor && (
          <div className="text-green-600 font-semibold mb-2">
            ✅ Calibrated: 1 px = {scaleFactor.toFixed(4)} meters
          </div>
        )}
        {measurements.length > 0 && (
          <div>
            <h2 className="font-semibold mb-2">📐 Measurements</h2>
            <ul className="text-sm space-y-1">
              {/* List all measurements */}
              {measurements.map((m, idx) => (
                <li key={m.id}>
                  #{idx + 1}: {m.pixelDistance.toFixed(2)} px
                  {m.realDistance !== null && (
                    <span className="text-blue-600 ml-2">
                      ≈ {m.realDistance.toFixed(2)} m
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
