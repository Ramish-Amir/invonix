export interface Point {
  x: number;
  y: number;
  page: number;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Measurement {
  id: number;
  points: [Point, Point];
  pixelDistance: number;
  page: number;
  tag?: Tag;
  createdAt: Date;
  updatedAt: Date;
}

export interface MeasurementDocument {
  id: string;
  name: string;
  fileName: string;
  fileUrl?: string;
  measurements: Measurement[];
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

export interface CreateMeasurementDocumentData {
  name: string;
  fileName: string;
  fileUrl?: string;
  userId: string;
}

export interface UpdateMeasurementDocumentData {
  name?: string;
  measurements?: Measurement[];
  tags?: Tag[];
  pageScales?: { [page: number]: number };
  callibrationScale?: { [page: number]: string };
  viewportDimensions?: {
    width: number;
    height: number;
  };
}
