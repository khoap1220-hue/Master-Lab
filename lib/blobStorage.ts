import { get, set, del, keys } from 'idb-keyval';

// Prefix for blob IDs to easily identify them
export const BLOB_PREFIX = 'blobid:';

/**
 * Saves a base64 string to IndexedDB and returns a blobId.
 */
export const saveBase64ToBlobStorage = async (base64: string): Promise<string> => {
  const id = `${BLOB_PREFIX}${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  // Convert base64 to Blob to save space and allow easy object URL creation
  const fetchRes = await fetch(base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${base64}`);
  const blob = await fetchRes.blob();
  
  await set(id, blob);
  return id;
};

/**
 * Retrieves a Blob from IndexedDB by its blobId.
 */
export const getBlobFromStorage = async (id: string): Promise<Blob | undefined> => {
  return await get(id);
};

/**
 * Retrieves a base64 string from IndexedDB by its blobId.
 * Useful when sending data back to the API.
 */
export const getBase64FromBlobStorage = async (id: string): Promise<string | undefined> => {
  const blob = await get(id);
  if (!blob) return undefined;
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Deletes a Blob from IndexedDB.
 */
export const deleteBlobFromStorage = async (id: string): Promise<void> => {
  await del(id);
};

/**
 * Cleans up all blobs from IndexedDB.
 */
export const clearAllBlobs = async (): Promise<void> => {
  const allKeys = await keys();
  const blobKeys = allKeys.filter(k => typeof k === 'string' && k.startsWith(BLOB_PREFIX));
  await Promise.all(blobKeys.map(k => del(k)));
};

/**
 * Helper to check if a string is a blobId.
 */
export const isBlobId = (str: string | undefined | null): boolean => {
  return !!str && str.startsWith(BLOB_PREFIX);
};
