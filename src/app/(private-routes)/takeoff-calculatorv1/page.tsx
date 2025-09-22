"use client";
import { createPluginRegistration } from "@embedpdf/core";
import { EmbedPDF } from "@embedpdf/core/react";
import { usePdfiumEngine } from "@embedpdf/engines/react";
import { ZoomPluginPackage, ZoomMode } from "@embedpdf/plugin-zoom/react";
import { TilingPluginPackage } from "@embedpdf/plugin-tiling/react";
import { useZoom } from "@embedpdf/plugin-zoom/react";

// Import the essential plugins
import {
  Viewport,
  ViewportPluginPackage,
} from "@embedpdf/plugin-viewport/react";
import { Scroller, ScrollPluginPackage } from "@embedpdf/plugin-scroll/react";
import { LoaderPluginPackage } from "@embedpdf/plugin-loader/react";
import {
  RenderLayer,
  RenderPluginPackage,
} from "@embedpdf/plugin-render/react";
import { TilingLayer } from "@embedpdf/plugin-tiling/react";

// 1. Register the plugins you need
const plugins = [
  createPluginRegistration(LoaderPluginPackage, {
    loadingOptions: {
      type: "url",
      pdfFile: {
        id: "local-sample-pdf",
        url:
          typeof window !== "undefined"
            ? `${window.location.origin}/sample.pdf`
            : "/sample.pdf", // fallback for SSR
      },
    },
  }),
  // Register and configure the tiling plugin
  createPluginRegistration(TilingPluginPackage, {
    tileSize: 768,
    overlapPx: 5,
    extraRings: 1, // Pre-render one ring of tiles outside the viewport
  }),
  createPluginRegistration(ViewportPluginPackage),
  createPluginRegistration(ScrollPluginPackage),
  createPluginRegistration(RenderPluginPackage),
  // Register and configure the zoom plugin
  createPluginRegistration(ZoomPluginPackage, {
    // Set the initial zoom level when a document loads
    defaultZoomLevel: ZoomMode.FitPage,
  }),
];

export const PDFViewer = () => {
  // 2. Initialize the engine with the React hook
  const { engine, isLoading, error } = usePdfiumEngine();

  if (isLoading || !engine) {
    return <div>Loading PDF Engine...</div>;
  }

  // 3. Wrap your UI with the <EmbedPDF> provider
  return (
    <div style={{ height: "calc(100vh - 100px)" }}>
      <EmbedPDF engine={engine} plugins={plugins}>
        <ZoomToolbar />
        <Viewport
          style={{
            backgroundColor: "#f1f3f5",
          }}
        >
          <Scroller
            renderPage={({ width, height, pageIndex, scale }) => (
              <div style={{ width, height, position: "relative" }}>
                {/* RenderLayer now uses the current scale for consistency */}
                <RenderLayer pageIndex={pageIndex} scale={scale} />
                <TilingLayer pageIndex={pageIndex} scale={scale} />
              </div>
            )}
          />
        </Viewport>
      </EmbedPDF>
    </div>
  );
};

function ZoomToolbar() {
  const { provides: zoom, state } = useZoom();
  return (
    <div
      className="toolbar"
      style={{
        display: "flex",
        gap: 8,
        alignItems: "center",
        marginBottom: 12,
      }}
    >
      <span>
        Zoom:{" "}
        {state.currentZoomLevel
          ? Math.round(state.currentZoomLevel * 100)
          : 100}
        %
      </span>
      {zoom ? (
        <>
          <button onClick={zoom.zoomOut} disabled={!zoom}>
            -
          </button>
          <button onClick={zoom.zoomIn} disabled={!zoom}>
            +
          </button>
          <button onClick={() => zoom.requestZoom(1.0)} disabled={!zoom}>
            Reset
          </button>
          <button onClick={zoom.toggleMarqueeZoom} disabled={!zoom}>
            Area Zoom
          </button>
        </>
      ) : (
        <span style={{ color: "gray" }}>Zoom unavailable</span>
      )}
    </div>
  );
}

export default PDFViewer;
