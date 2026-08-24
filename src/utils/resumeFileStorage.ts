/**
 * IndexedDB Binary Storage for Original Uploaded Resumes
 * Ensures 100% byte-for-byte exact preservation of original PDF files
 * without regeneration or text-to-canvas reconstruction.
 */

const DB_NAME = 'CareerPilot_ResumeStorage';
const DB_VERSION = 1;
const STORE_NAME = 'original_resumes';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (event: Event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onerror = (event: Event) => {
      reject((event.target as IDBOpenDBRequest).error || new Error('Failed to open IndexedDB'));
    };
  });
}

/**
 * Store the original exact binary file blob for a resume_id
 */
export async function saveResumeBlob(resumeId: string, blob: Blob | File): Promise<void> {
  if (!resumeId || !blob) return;
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(blob, resumeId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('[Resume File Storage] Failed to save blob to IndexedDB:', err);
  }
}

/**
 * Retrieve the original exact binary file blob for a resume_id
 */
export async function getResumeBlob(resumeId: string): Promise<Blob | null> {
  if (!resumeId) return null;
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(resumeId);

      request.onsuccess = () => {
        const result = request.result;
        if (result instanceof Blob) {
          resolve(result);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('[Resume File Storage] Failed to retrieve blob from IndexedDB:', err);
    return null;
  }
}

/**
 * Delete the original binary file blob for a resume_id
 */
export async function deleteResumeBlob(resumeId: string): Promise<void> {
  if (!resumeId) return;
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(resumeId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('[Resume File Storage] Failed to delete blob from IndexedDB:', err);
  }
}
