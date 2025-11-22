import React, { useState, useEffect, useRef } from "react";
import { Pin, PinOff, Tag, Trash2 } from "lucide-react";
import { Fixture, Point } from "@/lib/types/fixture";
import { Tag as TagType } from "@/lib/types/measurement";

interface FixtureOverlayProps {
  pageNumber: number;
  fixtures: Fixture[];
  scale: number;
  hoveredId: number | null;
  pinnedIds: Set<number>;
  setHoveredId: (id: number | null) => void;
  onTogglePin: (id: number) => void;
  onTagChange?: (fixtureId: number, tag: TagType | null) => void;
  onDeleteFixture?: (fixtureId: number) => void;
  onPositionUpdate?: (fixtureId: number, newPoint: Point) => void;
  tags: TagType[];
  pageWidth: number;
}

export const FixtureOverlay: React.FC<FixtureOverlayProps> = ({
  pageNumber,
  fixtures,
  scale,
  hoveredId,
  pinnedIds,
  setHoveredId,
  onTogglePin,
  onTagChange,
  onDeleteFixture,
  onPositionUpdate,
  tags,
  pageWidth,
}) => {
  const [tagSelectorForId, setTagSelectorForId] = useState<number | null>(null);
  const tagSelectorRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; fixtureId: number } | null>(null);
  const [hasDragged, setHasDragged] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const pageFixtures = fixtures.filter(
    (f) => f.point.page === pageNumber
  );

  // Close tag selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tagSelectorRef.current &&
        !tagSelectorRef.current.contains(event.target as Node)
      ) {
        setTagSelectorForId(null);
      }
    };

    if (tagSelectorForId !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [tagSelectorForId]);

  // Calculate dynamic circle radius based on zoom level
  // 16px radius at 1100% zoom (scale = 11), clamped between 2px and 16px
  const circleRadius = Math.max(2, Math.min(16, 20 * (scale / 11)));

  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent<SVGCircleElement>, fixtureId: number) => {
    e.stopPropagation();
    // Only start dragging if onPositionUpdate is provided
    if (onPositionUpdate) {
      setHasDragged(false);
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        setDragStart({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          fixtureId,
        });
        setDraggingId(fixtureId);
      }
    }
  };

  // Handle drag move
  useEffect(() => {
    if (!draggingId || !dragStart || !onPositionUpdate) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;

      // Check if mouse moved significantly (more than 3 pixels) to consider it a drag
      const dx = currentX - dragStart.x;
      const dy = currentY - dragStart.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 3) {
        setHasDragged(true);
        // Convert screen coordinates to document coordinates
        const newX = currentX / scale;
        const newY = currentY / scale;

        // Update fixture position
        onPositionUpdate(dragStart.fixtureId, { x: newX, y: newY, page: pageNumber });
      }
    };

    const handleMouseUp = () => {
      // If it was just a click (no drag), toggle pin
      if (!hasDragged && dragStart) {
        onTogglePin(dragStart.fixtureId);
      }
      setDraggingId(null);
      setDragStart(null);
      setHasDragged(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [draggingId, dragStart, hasDragged, scale, pageNumber, onPositionUpdate, onTogglePin]);

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
      <svg
        ref={svgRef}
        className="absolute top-0 left-0 pointer-events-auto"
        width={pageWidth}
        height="100%"
        cursor={draggingId ? "grabbing" : "crosshair"}
      >
        {pageFixtures.map((f) => {
          const x = f.point.x * scale;
          const y = f.point.y * scale;
          const isPinned = pinnedIds.has(f.id);
          const isDragging = draggingId === f.id;

          return (
            <g key={f.id}>
              <circle
                cx={x}
                cy={y}
                r={circleRadius}
                fill={f.tag?.color || "red"}
                opacity={isDragging ? 0.9 : 0.7}
                stroke={f.tag?.color || "red"}
                strokeWidth={isPinned ? 2 : 1}
                onMouseEnter={() => !draggingId && setHoveredId(f.id)}
                onMouseLeave={() => !draggingId && setHoveredId(null)}
                onMouseDown={(e) => handleMouseDown(e, f.id)}
                style={{
                  cursor: onPositionUpdate ? "grab" : "pointer",
                  pointerEvents: "visiblePainted",
                }}
              />
            </g>
          );
        })}
      </svg>

      {/* HTML labels (outside of SVG) */}
      {pageFixtures.map((f) => {
        const shouldShowLabel = hoveredId === f.id || pinnedIds.has(f.id);
        if (!shouldShowLabel) return null;
        const x = f.point.x * scale;
        const y = f.point.y * scale;

        const isPinned = pinnedIds.has(f.id);
        const isShowingTagSelector = tagSelectorForId === f.id;

        return (
          <div
            key={`label-${f.id}`}
            className="absolute flex flex-col gap-1"
            style={{
              left: x,
              top: y - 30, // position above the circle
              transform: "translateX(-50%)", // center horizontally
              pointerEvents: "auto", // so button is clickable
            }}
          >
            {/* Main label */}
            <div className="flex items-center gap-2 w-max bg-primary text-white text-xs px-2 py-1 rounded shadow">
              {f.tag && (
                <div
                  className="w-3 h-3 rounded-full border border-white"
                  style={{ backgroundColor: f.tag.color }}
                />
              )}
              <span
                className="cursor-pointer hover:bg-white/20 rounded px-1 transition-colors"
                onClick={() =>
                  setTagSelectorForId(isShowingTagSelector ? null : f.id)
                }
                title="Click to change fixture type"
              >
                {f.tag?.name || "Untagged"}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin(f.id);
                }}
                className="hover:bg-white/20 rounded p-0.5 transition-colors"
                title={isPinned ? "Unpin fixture" : "Pin fixture"}
              >
                {isPinned ? (
                  <PinOff className="w-3 h-3" />
                ) : (
                  <Pin className="w-3 h-3" />
                )}
              </button>
              {isPinned && onDeleteFixture && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFixture(f.id);
                  }}
                  className="hover:bg-red-500/20 rounded p-0.5 transition-colors"
                  title="Delete fixture"
                >
                  <Trash2 className="w-3 h-3 text-red-300 hover:text-red-100" />
                </button>
              )}
            </div>

            {/* Tag selector dropdown */}
            {isShowingTagSelector && onTagChange && (
              <div
                ref={tagSelectorRef}
                className="bg-white border border-gray-200 rounded-md shadow-lg p-2 min-w-[120px]"
              >
                <div className="flex items-center gap-1 text-xs text-gray-600 mb-2 font-medium">
                  <Tag className="w-3 h-3" /> Select Fixture Type:
                </div>
                <div className="space-y-1">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => {
                        onTagChange(f.id, tag);
                        setTagSelectorForId(null);
                      }}
                      className="flex items-center gap-2 w-full text-left px-2 py-1 rounded hover:bg-gray-100 text-xs"
                    >
                      <div
                        className="w-3 h-3 rounded-full border border-gray-300"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span>{tag.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

