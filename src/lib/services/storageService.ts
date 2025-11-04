import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "../firebase";

// Default storage limit: 1GB in bytes
export const DEFAULT_STORAGE_LIMIT = 1 * 1024 * 1024 * 1024; // 1GB

/**
 * Get company storage information
 */
export async function getCompanyStorage(companyId: string): Promise<{
  storageLimit: number;
  storageUsed: number;
  storageAvailable: number;
}> {
  try {
    const companyDoc = await getDoc(doc(db, "companies", companyId));

    if (!companyDoc.exists()) {
      throw new Error("Company not found");
    }

    const companyData = companyDoc.data();
    const storageLimit = companyData.storageLimit || DEFAULT_STORAGE_LIMIT;
    const storageUsed = companyData.storageUsed || 0;
    const storageAvailable = storageLimit - storageUsed;

    return {
      storageLimit,
      storageUsed,
      storageAvailable,
    };
  } catch (error) {
    console.error("Error getting company storage:", error);
    throw error;
  }
}

/**
 * Check if company has enough storage for a file
 */
export async function checkStorageAvailability(
  companyId: string,
  fileSize: number
): Promise<{
  available: boolean;
  availableBytes: number;
  usedBytes: number;
  limitBytes: number;
}> {
  try {
    const storage = await getCompanyStorage(companyId);
    const available = storage.storageAvailable >= fileSize;

    return {
      available,
      availableBytes: storage.storageAvailable,
      usedBytes: storage.storageUsed,
      limitBytes: storage.storageLimit,
    };
  } catch (error) {
    console.error("Error checking storage availability:", error);
    throw error;
  }
}

/**
 * Increase company storage usage
 */
export async function increaseStorageUsage(
  companyId: string,
  fileSize: number
): Promise<void> {
  try {
    const companyRef = doc(db, "companies", companyId);

    // Use Firestore increment to atomically update storage
    await updateDoc(companyRef, {
      storageUsed: increment(fileSize),
    });
  } catch (error) {
    console.error("Error increasing storage usage:", error);
    throw error;
  }
}

/**
 * Decrease company storage usage
 */
export async function decreaseStorageUsage(
  companyId: string,
  fileSize: number
): Promise<void> {
  try {
    const companyRef = doc(db, "companies", companyId);

    // Use Firestore increment (negative) to atomically decrease storage
    await updateDoc(companyRef, {
      storageUsed: increment(-fileSize),
    });
  } catch (error) {
    console.error("Error decreasing storage usage:", error);
    throw error;
  }
}

/**
 * Update company storage limit (admin only)
 */
export async function updateStorageLimit(
  companyId: string,
  newLimit: number
): Promise<void> {
  try {
    const companyRef = doc(db, "companies", companyId);
    await updateDoc(companyRef, {
      storageLimit: newLimit,
    });
  } catch (error) {
    console.error("Error updating storage limit:", error);
    throw error;
  }
}

/**
 * Format bytes to human-readable format
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Parse human-readable format to bytes
 */
export function parseBytes(sizeString: string): number {
  const units: { [key: string]: number } = {
    bytes: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
    tb: 1024 * 1024 * 1024 * 1024,
  };

  const match = sizeString
    .toLowerCase()
    .match(/^([\d.]+)\s*(bytes|kb|mb|gb|tb)$/i);
  if (!match) {
    throw new Error("Invalid size format. Use format like '1GB' or '500MB'");
  }

  const value = parseFloat(match[1]);
  const unit = match[2].toLowerCase();

  return value * (units[unit] || 1);
}
