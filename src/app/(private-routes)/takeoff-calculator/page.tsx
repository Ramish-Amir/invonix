"use client";

import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { pdfjs, Document, Page } from "react-pdf";
import { Redo, Undo, Upload } from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

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
  realDistance: number | null;
}

const maxWidth = 800;

export default function PDFViewer() {
  const fileId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  const [file, setFile] = useState<PDFFile>("/sample.pdf");
  const [numPages, setNumPages] = useState<number>();
  const [scale, setScale] = useState(1.25);
  const [containerWidth, setContainerWidth] = useState<number>();
  const [pdfWidth, setPdfWidth] = useState<number>(0);
  const [calibrating, setCalibrating] = useState(false);
  const [scaleFactor, setScaleFactor] = useState<number | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [history, setHistory] = useState<Measurement[][]>([]);
  const [redoStack, setRedoStack] = useState<Measurement[][]>([]);

  const [hoveredId, setHoveredId] = useState<number | null>(null);

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
    let realDistance = null;

    if (calibrating) {
      const input = prompt("Enter real-world distance in meters:");
      const meters = parseFloat(input || "0");
      if (!isNaN(meters) && meters > 0) {
        const sf = meters / pixelDistance;
        setScaleFactor(sf);
        alert(`Calibration complete: 1 px = ${sf.toFixed(4)} meters`);
      }
      setCalibrating(false);
    } else {
      if (scaleFactor) {
        realDistance = pixelDistance * scaleFactor;
      }

      const newMeasurement: Measurement = {
        id: Date.now(),
        points: [p1, p2],
        pixelDistance,
        realDistance,
      };

      const updatedMeasurements = [...measurements, newMeasurement];
      setMeasurements(updatedMeasurements);
      setHistory((prev) => [...prev, measurements]);
      setRedoStack([]);
    }

    // Reset drag state
    setDragStart(null);
    setDragEnd(null);
    setDragPage(null);
    setIsDragging(false);
  };

  const renderOverlay = (pageNumber: number) => {
    const pageMeasurements = measurements.filter(
      (m) => m.points[0].page === pageNumber && m.points[1].page === pageNumber
    );

    return (
      <svg
        className="absolute top-0 left-0 pointer-events-auto"
        width={pdfWidth}
        height="100%"
      >
        {pageMeasurements.map((m) => {
          const x1 = m.points[0].x * scale;
          const y1 = m.points[0].y * scale;
          const x2 = m.points[1].x * scale;
          const y2 = m.points[1].y * scale;
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;
          const label =
            m.realDistance !== null
              ? `${m.realDistance.toFixed(2)} m`
              : `${m.pixelDistance.toFixed(1)} px`;

          return (
            <g key={m.id}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="red"
                strokeWidth={4}
                strokeLinecap="round"
                opacity={0.5}
                onMouseEnter={() => setHoveredId(m.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{ cursor: "pointer", pointerEvents: "visiblePainted" }}
              />
              {hoveredId === m.id && (
                <text
                  x={midX}
                  y={midY - 8}
                  fill="black"
                  fontSize={12}
                  textAnchor="middle"
                  stroke="white"
                  strokeWidth={0.5}
                  paintOrder="stroke"
                >
                  {label}
                </text>
              )}
            </g>
          );
        })}

        {/* Preview line during drag */}
        {isDragging && dragStart && dragEnd && dragPage === pageNumber && (
          <line
            x1={dragStart.x * scale}
            y1={dragStart.y * scale}
            x2={dragEnd.x * scale}
            y2={dragEnd.y * scale}
            stroke="blue"
            strokeWidth={2}
            strokeDasharray="5,5"
            opacity={0.7}
          />
        )}
      </svg>
    );
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

  return (
    <div className="">
      <h2 className="text-gray-500">Take-off Calculator</h2>

      <div className="flex justify-between items-center">
        <div className="flex gap-2 my-4">
          <Button variant={"outline"} onClick={() => setScale((s) => s + 0.25)}>
            Zoom In
          </Button>
          <Button
            variant={"outline"}
            onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
          >
            Zoom Out
          </Button>
          <Button onClick={() => setCalibrating(true)}>Calibrate</Button>
          <Button
            variant={"outline"}
            onClick={handleUndo}
            disabled={history.length === 0}
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            variant={"outline"}
            onClick={handleRedo}
            disabled={redoStack.length === 0}
          >
            <Redo className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex gap-1 items-center">
          <div>
            <label className="flex w-max h-[36px] items-center justify-center px-4 py-2 bg-primary text-white rounded-lg cursor-pointer hover:bg-primary-700 transition-colors">
              <Upload className="w-4 h-4 mr-2" />
              Upload PDF
              <input
                type="file"
                accept="application/pdf"
                multiple
                onChange={onFileChange}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {file && (
        <div className="max-w-[100%] overflow-auto" ref={containerRef}>
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
                  }}
                />
                {renderOverlay(index + 1)}
              </div>
            ))}
          </Document>
        </div>
      )}

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
