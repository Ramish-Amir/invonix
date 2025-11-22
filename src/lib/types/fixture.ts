import { Point, Tag } from "./measurement";

// Re-export Point and Tag for convenience
export type { Point, Tag };

export interface Fixture {
  id: number;
  point: Point; // Single point instead of [Point, Point]
  page: number;
  tag?: Tag;
  createdAt: Date;
  updatedAt: Date;
}

export interface FixtureDocument {
  id: string;
  name: string;
  fileName: string;
  fileUrl?: string;
  fileSize?: number; // File size in bytes
  fixtures: Fixture[];
  tags: Tag[];
  pageScales: { [page: number]: number };
  callibrationScale: { [page: number]: string };
  viewportDimensions: {
    width: number;
    height: number;
  };
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface CreateFixtureDocumentData {
  name: string;
  fileName: string;
  fileUrl?: string;
  fileSize?: number; // File size in bytes
  userId: string;
}

export interface UpdateFixtureDocumentData {
  name?: string;
  fixtures?: Fixture[];
  tags?: Tag[];
  pageScales?: { [page: number]: number };
  callibrationScale?: { [page: number]: string };
  viewportDimensions?: {
    width: number;
    height: number;
  };
}

