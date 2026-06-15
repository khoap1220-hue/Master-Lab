import { useState, useEffect } from 'react';
import { getBlobFromStorage, isBlobId } from '../lib/blobStorage';

/**
 * A hook that takes a string (either a base64 string, a URL, or a blobId).
 * If it's a blobId, it fetches the Blob from IndexedDB and creates a temporary object URL.
 * It automatically revokes the object URL when the component unmounts or the blobId changes.
 */
export const useBlobUrl = (source: string | undefined | null) => {
  const [url, setUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!source) {
      setUrl(undefined);
      return;
    }

    // If it's not a blobId, just use the source directly (base64 or http URL)
    if (!isBlobId(source)) {
      setUrl(source);
      return;
    }

    let objectUrl: string | undefined;

    const loadBlob = async () => {
      try {
        const blob = await getBlobFromStorage(source);
        if (blob) {
          objectUrl = URL.createObjectURL(blob);
          setUrl(objectUrl);
        } else {
          console.warn(`[useBlobUrl] Blob not found for id: ${source}`);
          setUrl(undefined);
        }
      } catch (error) {
        console.error(`[useBlobUrl] Error loading blob:`, error);
        setUrl(undefined);
      }
    };

    loadBlob();

    // Cleanup function to revoke the object URL
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [source]);

  return url;
};
