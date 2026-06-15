
import { NeuralEvent, MemoryInsight } from "../types";
import { auth, db, handleFirestoreError, OperationType } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const REGISTRY_KEY = "NEURAL_REGISTRY_LOG_V6";

// Create custom event for real-time UI updates
export const NEURAL_UPDATE_EVENT = 'NEURAL_REGISTRY_UPDATE';

export const saveEvent = async (event: NeuralEvent) => {
  // 1. Local Fallback (for immediate UI feedback if needed)
  try {
    const events = getEvents();
    const updated = [event, ...events].slice(0, 50);
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(NEURAL_UPDATE_EVENT));
    }
  } catch (e) {
    console.warn("Local storage error:", e);
  }

  // 2. Firestore Sync
  const user = auth.currentUser;
  if (user) {
    try {
      await addDoc(collection(db, 'registry'), {
        ...event,
        userId: user.uid,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'registry');
    }
  }
};

export const clearEvents = () => {
  localStorage.removeItem(REGISTRY_KEY);
};

export const getEvents = (): NeuralEvent[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(REGISTRY_KEY);
  try {
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const createEvent = (
  type: NeuralEvent['type'], 
  metadata: NeuralEvent['metadata'], 
  snapshot: Partial<MemoryInsight>
): NeuralEvent => {
  return {
    id: `ev-${Math.random().toString(36).substring(7)}`,
    timestamp: new Date().toISOString(),
    type,
    metadata,
    snapshot
  };
};

export const checkRegression = (event: NeuralEvent, currentDrift: number): boolean => {
  if (event.metadata.driftLevel && Math.abs(event.metadata.driftLevel - currentDrift) > 3) {
    return true;
  }
  return false;
};

export const getSystemManifest = async () => {
  try {
    const response = await fetch('/system/system_manifest.json');
    if (!response.ok) return null;
    return await response.json();
  } catch (e) {
    console.warn("Failed to load system manifest:", e);
    return null;
  }
};

export const getSystemHistory = async () => {
  try {
    const response = await fetch('/system/system_manifest_version.json');
    if (!response.ok) return null;
    return await response.json();
  } catch (e) {
    console.warn("Failed to load history ledger:", e);
    return null;
  }
};
