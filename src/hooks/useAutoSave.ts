"use client";

import { useEffect, useRef, useCallback } from "react";
import { MeasurementDocument, Measurement, Tag } from "@/lib/types/measurement";
import { updateMeasurementDocument } from "@/lib/services/measurementService";

interface UseAutoSaveProps {
  document: MeasurementDocument | null;
  measurements: Measurement[];
  tags: Tag[];
  pageScales: { [page: number]: number };
  callibrationScale: { [page: number]: string };
  viewportDimensions: { width: number; height: number };
  onDocumentUpdate: (document: MeasurementDocument) => void;
  companyId: string;
  projectId: string;
  debounceMs?: number;
}

export function useAutoSave({
  document,
  measurements,
  tags,
  pageScales,
  callibrationScale,
  viewportDimensions,
  onDocumentUpdate,
  companyId,
  projectId,
  debounceMs = 2000,
}: UseAutoSaveProps) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>("");

  // Helper function to create a stable data representation for comparison
  const createStableDataString = useCallback(
    (data: {
      measurements: Measurement[];
      tags: Tag[];
      pageScales: { [page: number]: number };
      callibrationScale: { [page: number]: string };
      viewportDimensions: { width: number; height: number };
    }) => {
      // Create a copy without timestamps for stable comparison
      const stableMeasurements = data.measurements.map((m) => ({
        id: m.id,
        points: m.points,
        pixelDistance: m.pixelDistance,
        page: m.page,
        tag: m.tag,
        // Exclude createdAt and updatedAt from comparison
      }));

      return JSON.stringify({
        measurements: stableMeasurements,
        tags: data.tags,
        pageScales: data.pageScales,
        callibrationScale: data.callibrationScale,
        viewportDimensions: data.viewportDimensions,
      });
    },
    []
  );

  const saveToDatabase = useCallback(async () => {
    if (!document || !companyId || !projectId) return;

    try {
      // Only update timestamps for measurements that actually changed
      const measurementsWithTimestamps = measurements.map((measurement) => ({
        ...measurement,
        updatedAt: measurement.updatedAt || new Date(),
      }));

      await updateMeasurementDocument(companyId, projectId, document.id, {
        measurements: measurementsWithTimestamps,
        tags,
        pageScales,
        callibrationScale,
        viewportDimensions,
      });

      const updatedDocument: MeasurementDocument = {
        ...document,
        measurements: measurementsWithTimestamps,
        tags,
        pageScales,
        callibrationScale,
        viewportDimensions,
        updatedAt: new Date(),
      };

      onDocumentUpdate(updatedDocument);

      // Update the last saved reference with stable data (without timestamps)
      const stableData = {
        measurements,
        tags,
        pageScales,
        callibrationScale,
        viewportDimensions,
      };
      lastSavedRef.current = createStableDataString(stableData);
      console.log("✅ Auto-save completed successfully");
    } catch (error) {
      console.error("Error auto-saving document:", error);
    }
  }, [
    document,
    measurements,
    tags,
    pageScales,
    callibrationScale,
    viewportDimensions,
    onDocumentUpdate,
    createStableDataString,
    companyId,
    projectId,
  ]);

  const debouncedSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      saveToDatabase();
    }, debounceMs);
  }, [saveToDatabase, debounceMs]);

  // Check if data has changed and trigger save
  useEffect(() => {
    if (!document) return;

    const currentData = {
      measurements,
      tags,
      pageScales,
      callibrationScale,
      viewportDimensions,
    };

    const currentDataString = createStableDataString(currentData);

    if (currentDataString !== lastSavedRef.current) {
      console.log("🔄 Data changed, triggering auto-save...");
      debouncedSave();
    }
  }, [
    measurements,
    tags,
    pageScales,
    callibrationScale,
    viewportDimensions,
    debouncedSave,
    document,
    createStableDataString,
    companyId,
    projectId,
  ]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Force save function (useful for manual saves)
  const forceSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    saveToDatabase();
  }, [saveToDatabase]);

  return {
    forceSave,
  };
}
