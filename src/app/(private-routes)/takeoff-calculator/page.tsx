"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { pdfjs, Document, Page } from "react-pdf";
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
  const [file, setFile] = useState<PDFFile>(null);
  const [numPages, setNumPages] = useState<number>();
  const [scale, setScale] = useState(1.25);
  const [containerWidth, setContainerWidth] = useState<number>();
  const [calibrating, setCalibrating] = useState(false);
  const [scaleFactor, setScaleFactor] = useState<number | null>(null);
  const [tempPoints, setTempPoints] = useState<Point[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);

  const onResize = useCallback<ResizeObserverCallback>((entries) => {
    const [entry] = entries;
    if (entry) {
      setContainerWidth(entry.contentRect.width);
    }
  }, []);

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const nextFile = event.target.files?.[0] ?? null;
    setFile(nextFile);
    setNumPages(undefined);
    setMeasurements([]);
    setScaleFactor(null);
    setTempPoints([]);
  }

  function onDocumentLoadSuccess({ numPages: nextNumPages }: any): void {
    setNumPages(nextNumPages);
  }

  function handleClick(
    e: React.MouseEvent<HTMLDivElement>,
    pageNumber: number
  ) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    const nextPoints = [...tempPoints, { x, y, page: pageNumber }];
    setTempPoints(nextPoints);

    if (nextPoints.length === 2) {
      const [p1, p2] = nextPoints;
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
        setTempPoints([]);
        return;
      }

      if (scaleFactor) realDistance = pixelDistance * scaleFactor;

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

  useEffect(() => {
    console.log("SCALE >>> ", scale);
  }, [scale]);

  const renderOverlay = (pageNumber: number) => {
    const pageMeasurements = measurements.filter(
      (m) => m.points[0].page === pageNumber && m.points[1].page === pageNumber
    );

    return (
      <svg
        className="absolute top-0 left-0 pointer-events-none"
        width="100%"
        height="100%"
      >
        {pageMeasurements.map((m) => (
          <line
            key={m.id}
            x1={m.points[0].x * scale}
            y1={m.points[0].y * scale}
            x2={m.points[1].x * scale}
            y2={m.points[1].y * scale}
            stroke="red"
            strokeWidth={2}
          />
        ))}
      </svg>
    );
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">📏 PDF Takeoff Tool</h1>

      <label htmlFor={fileId}>Upload a PDF:</label>
      <input
        id={fileId}
        onChange={onFileChange}
        type="file"
        accept="application/pdf"
        className="mb-4"
      />

      <div className="flex gap-2 mb-4">
        <button onClick={() => setScale((s) => s + 0.25)}>Zoom In</button>
        <button onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}>
          Zoom Out
        </button>
        <button onClick={() => setCalibrating(true)}>Calibrate</button>
      </div>

      {file && (
        <div ref={containerRef}>
          <Document
            file={file}
            onLoadSuccess={onDocumentLoadSuccess}
            options={options}
          >
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
