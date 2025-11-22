"use client";

import { useEffect, useRef, useCallback } from "react";
import { FixtureDocument, Fixture, Tag } from "@/lib/types/fixture";
import { updateFixtureDocument } from "@/lib/services/fixtureService";

interface UseAutoSaveFixturesProps {
  document: FixtureDocument | null;
  fixtures: Fixture[];
  tags: Tag[];
  pageScales: { [page: number]: number };
  callibrationScale: { [page: number]: string };
  viewportDimensions: { width: number; height: number };
  onDocumentUpdate: (document: FixtureDocument) => void;
  companyId: string;
  projectId: string;
  debounceMs?: number;
}

export function useAutoSaveFixtures({
  document,
  fixtures,
  tags,
  pageScales,
  callibrationScale,
  viewportDimensions,
  onDocumentUpdate,
  companyId,
  projectId,
  debounceMs = 2000,
}: UseAutoSaveFixturesProps) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>("");

  // Helper function to create a stable data representation for comparison
  const createStableDataString = useCallback(
    (data: {
      fixtures: Fixture[];
      tags: Tag[];
      pageScales: { [page: number]: number };
      callibrationScale: { [page: number]: string };
      viewportDimensions: { width: number; height: number };
    }) => {
      // Create a copy without timestamps for stable comparison
      const stableFixtures = data.fixtures.map((f) => ({
        id: f.id,
        point: f.point,
        page: f.page,
        tag: f.tag,
        // Exclude createdAt and updatedAt from comparison
      }));

      return JSON.stringify({
        fixtures: stableFixtures,
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
      // Only update timestamps for fixtures that actually changed
      const fixturesWithTimestamps = fixtures.map((fixture) => ({
        ...fixture,
        updatedAt: fixture.updatedAt || new Date(),
      }));

      await updateFixtureDocument(companyId, projectId, document.id, {
        fixtures: fixturesWithTimestamps,
        tags,
        pageScales,
        callibrationScale,
        viewportDimensions,
      });

      const updatedDocument: FixtureDocument = {
        ...document,
        fixtures: fixturesWithTimestamps,
        tags,
        pageScales,
        callibrationScale,
        viewportDimensions,
        updatedAt: new Date(),
      };

      onDocumentUpdate(updatedDocument);

      // Update the last saved reference with stable data (without timestamps)
      const stableData = {
        fixtures,
        tags,
        pageScales,
        callibrationScale,
        viewportDimensions,
      };
      lastSavedRef.current = createStableDataString(stableData);
    } catch (error) {
      console.error("Error auto-saving fixture document:", error);
    }
  }, [
    document,
    fixtures,
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
      fixtures,
      tags,
      pageScales,
      callibrationScale,
      viewportDimensions,
    };

    const currentDataString = createStableDataString(currentData);

    if (currentDataString !== lastSavedRef.current) {
      debouncedSave();
    }
  }, [
    fixtures,
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

