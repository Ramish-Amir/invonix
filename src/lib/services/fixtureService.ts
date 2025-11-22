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
  FixtureDocument,
  CreateFixtureDocumentData,
  UpdateFixtureDocumentData,
  Fixture,
  Tag,
} from "../types/fixture";

// Database structure: companies/{companyId}/projects/{projectId}/fixtures/{fixtureId}
const getProjectFixturesPath = (companyId: string, projectId: string) =>
  `companies/${companyId}/projects/${projectId}/fixtures`;

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

// Convert Firestore document to FixtureDocument
const convertFirestoreDoc = (doc: any): FixtureDocument => {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    fileName: data.fileName,
    fileUrl: data.fileUrl,
    fileSize: data.fileSize,
    fixtures:
      data.fixtures?.map((f: any) => ({
        ...f,
        createdAt: convertTimestamp(f.createdAt),
        updatedAt: convertTimestamp(f.updatedAt),
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

// Create a new fixture document
export const createFixtureDocument = async (
  companyId: string,
  projectId: string,
  data: CreateFixtureDocumentData
): Promise<string> => {
  try {
    const docRef = await addDoc(
      collection(db, getProjectFixturesPath(companyId, projectId)),
      {
        ...data,
        fixtures: [],
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
    console.error("Error creating fixture document:", error);
    throw error;
  }
};

// Get a fixture document by ID
export const getFixtureDocument = async (
  companyId: string,
  projectId: string,
  fixtureId: string
): Promise<FixtureDocument | null> => {
  try {
    const docRef = doc(
      db,
      getProjectFixturesPath(companyId, projectId),
      fixtureId
    );
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return convertFirestoreDoc(docSnap);
    }
    return null;
  } catch (error) {
    console.error("Error getting fixture document:", error);
    throw error;
  }
};

// Get all fixture documents for a project
export const getProjectFixtureDocuments = async (
  companyId: string,
  projectId: string
): Promise<FixtureDocument[]> => {
  try {
    // First try with ordering
    let q = query(
      collection(db, getProjectFixturesPath(companyId, projectId)),
      orderBy("updatedAt", "desc")
    );

    let querySnapshot;
    try {
      querySnapshot = await getDocs(q);
    } catch (orderError) {
      // Fallback to query without ordering
      q = query(
        collection(db, getProjectFixturesPath(companyId, projectId))
      );
      querySnapshot = await getDocs(q);
    }

    const docs = querySnapshot.docs.map(convertFirestoreDoc);

    // Sort manually if we couldn't use database ordering
    docs.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    return docs;
  } catch (error) {
    console.error("Error getting project fixture documents:", error);
    throw error;
  }
};

// Search fixture documents by name within a project
export const searchProjectFixtureDocuments = async (
  companyId: string,
  projectId: string,
  searchTerm: string,
  limitCount: number = 10
): Promise<FixtureDocument[]> => {
  try {
    // First try with ordering
    let q = query(
      collection(db, getProjectFixturesPath(companyId, projectId)),
      orderBy("name"),
      limit(limitCount)
    );

    let querySnapshot;
    try {
      querySnapshot = await getDocs(q);
    } catch (orderError) {
      // Fallback to query without ordering
      q = query(
        collection(db, getProjectFixturesPath(companyId, projectId)),
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
    console.error("Error searching fixture documents:", error);
    throw error;
  }
};

// Update a fixture document
export const updateFixtureDocument = async (
  companyId: string,
  projectId: string,
  fixtureId: string,
  data: UpdateFixtureDocumentData
): Promise<void> => {
  try {
    const docRef = doc(
      db,
      getProjectFixturesPath(companyId, projectId),
      fixtureId
    );
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating fixture document:", error);
    throw error;
  }
};

// Delete a fixture document
export const deleteFixtureDocument = async (
  companyId: string,
  projectId: string,
  fixtureId: string
): Promise<void> => {
  try {
    const docRef = doc(
      db,
      getProjectFixturesPath(companyId, projectId),
      fixtureId
    );
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting fixture document:", error);
    throw error;
  }
};

// Real-time listener for a fixture document
export const subscribeToFixtureDocument = (
  companyId: string,
  projectId: string,
  fixtureId: string,
  callback: (doc: FixtureDocument | null) => void
): (() => void) => {
  const docRef = doc(
    db,
    getProjectFixturesPath(companyId, projectId),
    fixtureId
  );

  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(convertFirestoreDoc(docSnap));
    } else {
      callback(null);
    }
  });
};

// Real-time listener for project's fixture documents
export const subscribeToProjectFixtureDocuments = (
  companyId: string,
  projectId: string,
  callback: (docs: FixtureDocument[]) => void
): (() => void) => {
  const q = query(
    collection(db, getProjectFixturesPath(companyId, projectId)),
    orderBy("updatedAt", "desc")
  );

  return onSnapshot(q, (querySnapshot) => {
    const docs = querySnapshot.docs.map(convertFirestoreDoc);
    callback(docs);
  });
};

// Helper function to update fixtures with proper timestamps
export const updateFixturesWithTimestamps = (
  fixtures: Fixture[]
): Fixture[] => {
  const now = new Date();
  return fixtures.map((fixture) => ({
    ...fixture,
    updatedAt: now,
    createdAt: fixture.createdAt || now,
  }));
};

