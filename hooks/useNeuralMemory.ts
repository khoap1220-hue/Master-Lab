
import { useState, useEffect } from 'react';
import { MemoryInsight, NeuralEvent } from '../types';
import { INITIAL_MEMORY } from '../data/constants';

// Firebase
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, onSnapshot, setDoc, collection, query, where, orderBy, limit } from 'firebase/firestore';
import { User } from 'firebase/auth';

export const useNeuralMemory = (user: User | null) => {
  const [memory, setMemory] = useState<MemoryInsight>(INITIAL_MEMORY);
  const [showMemory, setShowMemory] = useState(false);
  const [registry, setRegistry] = useState<NeuralEvent[]>([]);

  // Sync Memory from Firestore
  useEffect(() => {
    if (!user) {
      setMemory(INITIAL_MEMORY);
      return;
    }

    const memoryRef = doc(db, 'memory', user.uid);
    const unsubscribe = onSnapshot(memoryRef, (docSnap) => {
      if (docSnap.exists()) {
        setMemory(docSnap.data() as MemoryInsight);
      } else {
        // Initialize if not exists
        setDoc(memoryRef, INITIAL_MEMORY).catch(err => handleFirestoreError(err, OperationType.WRITE, `memory/${user.uid}`));
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `memory/${user.uid}`));

    return () => unsubscribe();
  }, [user]);

  // Sync Registry from Firestore
  useEffect(() => {
    if (!user) {
      setRegistry([]);
      return;
    }

    const q = query(
      collection(db, 'registry'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NeuralEvent));
      setRegistry(events);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'registry'));

    return () => unsubscribe();
  }, [user]);

  return {
    memory,
    setMemory,
    showMemory,
    setShowMemory,
    registry,
    setRegistry
  };
};
