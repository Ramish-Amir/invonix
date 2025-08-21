import React from "react";

export interface Point {
  x: number;
  y: number;
  page: number;
}

export interface Measurement {
  id: number;
  points: [Point, Point];
  pixelDistance: number;
}

interface MeasurementOverlayProps {
  pageNumber: number;
  measurements: Measurement[];
  scale: number;
  scaleFactor: number | null;
  hoveredId: number | null;
  isDragging: boolean;
  dragStart: Point | null;
  dragEnd: Point | null;
  dragPage: number | null;
  setHoveredId: (id: number | null) => void;
  pdfWidth: number;
}

export const MeasurementOverlay: React.FC<MeasurementOverlayProps> = ({
  pageNumber,
  measurements,
  scale,
  scaleFactor,
  hoveredId,
  isDragging,
  dragStart,
  dragEnd,
  dragPage,
  setHoveredId,
  pdfWidth,
}) => {
  const pageMeasurements = measurements.filter(
    (m) => m.points[0].page === pageNumber && m.points[1].page === pageNumber
  );

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
      <svg
        className="absolute top-0 left-0 pointer-events-auto"
        width={pdfWidth}
        height="100%"
      >
        {pageMeasurements.map((m) => {
          const [p1, p2] = m.points;
          const x1 = p1.x * scale;
          const y1 = p1.y * scale;
          const x2 = p2.x * scale;
          const y2 = p2.y * scale;

          return (
            <g key={m.id}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="red"
                // Update the stroke width based on a multiple of scale
                strokeWidth={(2 * scale) / 2}
                strokeLinecap="round"
                opacity={0.7}
                onMouseEnter={() => setHoveredId(m.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{ cursor: "pointer", pointerEvents: "visiblePainted" }}
              />
            </g>
          );
        })}

        {/* Drag preview line */}
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

      {/* HTML labels (outside of SVG) */}
      {pageMeasurements.map((m) => {
        if (hoveredId !== m.id) return null;
        const [p1, p2] = m.points;
        const x1 = p1.x * scale;
        const y1 = p1.y * scale;
        const x2 = p2.x * scale;
        const y2 = p2.y * scale;
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const label = `${(m.pixelDistance * (scaleFactor || 1)).toFixed(2)} m`;

        return (
          <div
            key={`label-${m.id}`}
            className="absolute flex items-center gap-2 w-max bg-primary text-white text-xs px-2 py-1 rounded shadow"
            style={{
              left: midX,
              top: midY - 30, // position above the line
              transform: "translateX(-50%)", // center horizontally
              pointerEvents: "auto", // so button is clickable
            }}
          >
            <span>{label}</span>
            {/* <button
              onClick={() => {
                // TODO: hook up delete functionality
                console.log("Delete measurement", m.id);
              }}
              className="bg-red-500 hover:bg-red-600 text-white px-1 rounded"
            >
              ✕
            </button> */}
          </div>
        );
      })}
    </div>
  );
};
