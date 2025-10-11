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

const COLLECTION_NAME = "measurementDocuments";

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
  data: CreateMeasurementDocumentData
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...data,
      measurements: [],
      tags: [],
      pageScales: {},
      callibrationScale: {},
      viewportDimensions: { width: 0, height: 0 },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating measurement document:", error);
    throw error;
  }
};

// Get a measurement document by ID
export const getMeasurementDocument = async (
  id: string
): Promise<MeasurementDocument | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
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

// Get all measurement documents for a user
export const getUserMeasurementDocuments = async (
  userId: string
): Promise<MeasurementDocument[]> => {
  try {
    // First try with ordering
    let q = query(
      collection(db, COLLECTION_NAME),
      where("userId", "==", userId),
      orderBy("updatedAt", "desc")
    );

    let querySnapshot;
    try {
      querySnapshot = await getDocs(q);
    } catch (orderError) {
      // Fallback to query without ordering
      q = query(collection(db, COLLECTION_NAME), where("userId", "==", userId));
      querySnapshot = await getDocs(q);
    }

    const docs = querySnapshot.docs.map(convertFirestoreDoc);

    // Sort manually if we couldn't use database ordering
    docs.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    return docs;
  } catch (error) {
    console.error("Error getting user measurement documents:", error);
    throw error;
  }
};

// Search measurement documents by name
export const searchMeasurementDocuments = async (
  userId: string,
  searchTerm: string,
  limitCount: number = 10
): Promise<MeasurementDocument[]> => {
  try {
    // First try with ordering
    let q = query(
      collection(db, COLLECTION_NAME),
      where("userId", "==", userId),
      orderBy("name"),
      limit(limitCount)
    );

    let querySnapshot;
    try {
      querySnapshot = await getDocs(q);
    } catch (orderError) {
      // Fallback to query without ordering
      q = query(
        collection(db, COLLECTION_NAME),
        where("userId", "==", userId),
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
  id: string,
  data: UpdateMeasurementDocumentData
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
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
export const deleteMeasurementDocument = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting measurement document:", error);
    throw error;
  }
};

// Real-time listener for a measurement document
export const subscribeToMeasurementDocument = (
  id: string,
  callback: (doc: MeasurementDocument | null) => void
): (() => void) => {
  const docRef = doc(db, COLLECTION_NAME, id);

  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(convertFirestoreDoc(docSnap));
    } else {
      callback(null);
    }
  });
};

// Real-time listener for user's measurement documents
export const subscribeToUserMeasurementDocuments = (
  userId: string,
  callback: (docs: MeasurementDocument[]) => void
): (() => void) => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where("userId", "==", userId),
    orderBy("updatedAt", "desc")
  );

  return onSnapshot(q, (querySnapshot) => {
    const docs = querySnapshot.docs.map(convertFirestoreDoc);
    callback(docs);
  });
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
