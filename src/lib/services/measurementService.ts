import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import {
  MeasurementDocument,
  CreateMeasurementDocumentData,
  UpdateMeasurementDocumentData,
  Measurement,
  Tag,
} from "../types/measurement";

// New database structure: companies/{companyId}/projects/{projectId}/measurements/{measurementId}
const getProjectMeasurementsPath = (companyId: string, projectId: string) =>
  `companies/${companyId}/projects/${projectId}/measurements`;

// Convert Firestore timestamp to Date
const convertTimestamp = (timestamp: any): Date => {
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  return new Date(timestamp);
};

// Convert Date to Firestore timestamp
const convertToTimestamp = (date: Date): Timestamp => {
  return Timestamp.fromDate(date);
};

// Convert Firestore document to MeasurementDocument
const convertFirestoreDoc = (doc: any): MeasurementDocument => {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    fileName: data.fileName,
    fileUrl: data.fileUrl,
    measurements:
      data.measurements?.map((m: any) => ({
        ...m,
        createdAt: convertTimestamp(m.createdAt),
        updatedAt: convertTimestamp(m.updatedAt),
      })) || [],
    tags: data.tags || [],
    pageScales: data.pageScales || {},
    callibrationScale: data.callibrationScale || {},
    viewportDimensions: data.viewportDimensions || { width: 0, height: 0 },
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
    userId: data.userId,
  };
};

// Create a new measurement document
export const createMeasurementDocument = async (
  companyId: string,
  projectId: string,
  data: CreateMeasurementDocumentData
): Promise<string> => {
  try {
    const docRef = await addDoc(
      collection(db, getProjectMeasurementsPath(companyId, projectId)),
      {
        ...data,
        measurements: [],
        tags: [],
        pageScales: {},
        callibrationScale: {},
        viewportDimensions: { width: 0, height: 0 },
        companyId,
        projectId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
    );
    return docRef.id;
  } catch (error) {
    console.error("Error creating measurement document:", error);
    throw error;
  }
};

// Get a measurement document by ID
export const getMeasurementDocument = async (
  companyId: string,
  projectId: string,
  measurementId: string
): Promise<MeasurementDocument | null> => {
  try {
    const docRef = doc(
      db,
      getProjectMeasurementsPath(companyId, projectId),
      measurementId
    );
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return convertFirestoreDoc(docSnap);
    }
    return null;
  } catch (error) {
    console.error("Error getting measurement document:", error);
    throw error;
  }
};

// Get all measurement documents for a project
export const getProjectMeasurementDocuments = async (
  companyId: string,
  projectId: string
): Promise<MeasurementDocument[]> => {
  try {
    // First try with ordering
    let q = query(
      collection(db, getProjectMeasurementsPath(companyId, projectId)),
      orderBy("updatedAt", "desc")
    );

    let querySnapshot;
    try {
      querySnapshot = await getDocs(q);
    } catch (orderError) {
      // Fallback to query without ordering
      q = query(
        collection(db, getProjectMeasurementsPath(companyId, projectId))
      );
      querySnapshot = await getDocs(q);
    }

    const docs = querySnapshot.docs.map(convertFirestoreDoc);

    // Sort manually if we couldn't use database ordering
    docs.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    return docs;
  } catch (error) {
    console.error("Error getting project measurement documents:", error);
    throw error;
  }
};

// Search measurement documents by name within a project
export const searchProjectMeasurementDocuments = async (
  companyId: string,
  projectId: string,
  searchTerm: string,
  limitCount: number = 10
): Promise<MeasurementDocument[]> => {
  try {
    // First try with ordering
    let q = query(
      collection(db, getProjectMeasurementsPath(companyId, projectId)),
      orderBy("name"),
      limit(limitCount)
    );

    let querySnapshot;
    try {
      querySnapshot = await getDocs(q);
    } catch (orderError) {
      // Fallback to query without ordering
      q = query(
        collection(db, getProjectMeasurementsPath(companyId, projectId)),
        limit(limitCount)
      );
      querySnapshot = await getDocs(q);
    }

    const allDocs = querySnapshot.docs.map(convertFirestoreDoc);

    // Filter by search term (case-insensitive)
    const filteredDocs = allDocs.filter(
      (doc) =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.fileName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort manually if we couldn't use database ordering
    filteredDocs.sort((a, b) => a.name.localeCompare(b.name));

    return filteredDocs;
  } catch (error) {
    console.error("Error searching measurement documents:", error);
    throw error;
  }
};

// Update a measurement document
export const updateMeasurementDocument = async (
  companyId: string,
  projectId: string,
  measurementId: string,
  data: UpdateMeasurementDocumentData
): Promise<void> => {
  try {
    const docRef = doc(
      db,
      getProjectMeasurementsPath(companyId, projectId),
      measurementId
    );
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating measurement document:", error);
    throw error;
  }
};

// Delete a measurement document
export const deleteMeasurementDocument = async (
  companyId: string,
  projectId: string,
  measurementId: string
): Promise<void> => {
  try {
    const docRef = doc(
      db,
      getProjectMeasurementsPath(companyId, projectId),
      measurementId
    );
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting measurement document:", error);
    throw error;
  }
};

// Real-time listener for a measurement document
export const subscribeToMeasurementDocument = (
  companyId: string,
  projectId: string,
  measurementId: string,
  callback: (doc: MeasurementDocument | null) => void
): (() => void) => {
  const docRef = doc(
    db,
    getProjectMeasurementsPath(companyId, projectId),
    measurementId
  );

  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(convertFirestoreDoc(docSnap));
    } else {
      callback(null);
    }
  });
};

// Real-time listener for project's measurement documents
export const subscribeToProjectMeasurementDocuments = (
  companyId: string,
  projectId: string,
  callback: (docs: MeasurementDocument[]) => void
): (() => void) => {
  const q = query(
    collection(db, getProjectMeasurementsPath(companyId, projectId)),
    orderBy("updatedAt", "desc")
  );

  return onSnapshot(q, (querySnapshot) => {
    const docs = querySnapshot.docs.map(convertFirestoreDoc);
    callback(docs);
  });
};

// Get all projects for a company
export const getCompanyProjects = async (companyId: string) => {
  try {
    const projectsSnapshot = await getDocs(
      collection(db, "companies", companyId, "projects")
    );
    const projects = projectsSnapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name || "",
      description: doc.data().description || "",
      status: doc.data().status || "active",
      createdBy: doc.data().createdBy || "",
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
    }));
    return projects;
  } catch (error) {
    console.error("Error getting company projects:", error);
    throw error;
  }
};

// Helper function to update measurements with proper timestamps
export const updateMeasurementsWithTimestamps = (
  measurements: Measurement[]
): Measurement[] => {
  const now = new Date();
  return measurements.map((measurement) => ({
    ...measurement,
    updatedAt: now,
    createdAt: measurement.createdAt || now,
  }));
};
