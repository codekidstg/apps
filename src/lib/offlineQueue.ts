"use client";

// IndexedDB offline action queue — no external deps
const DB_NAME = "codekids-offline";
const DB_VERSION = 1;
const STORE = "pending_actions";

export type OfflineAction =
  | { type: "completeLesson"; lessonId: string; score: number; perfect: boolean }
  // `blockId` identifie le defi resolu : c'est la cle d'idempotence cote
  // serveur, un meme defi ne se paie qu'une fois.
  | { type: "solveBlockly"; lessonId: string; blockId?: string }
  // Un exercice fini hors ligne : score, temps passe et « sans indice »
  // voyagent avec, sinon la mesure serait perdue au retour du reseau.
  | { type: "completeTraining"; trainingId: string; score: number; secondes?: number; sansIndice?: boolean };

/**
 * Appelle le serveur, et met l'action de cote s'il est injoignable.
 *
 * C'etait LE trou : les actions serveur etaient appelees sans filet. Hors
 * ligne, la promesse echouait, personne ne l'attrapait, et l'erreur remontait
 * jusqu'a la frontiere par defaut de Next.js — qui remplace la page entiere.
 * Un enfant qui cliquait sur un jeu sans reseau voyait son ecran disparaitre.
 *
 * Rend `null` quand l'appel n'a pas abouti : l'appelant continue son chemin
 * sans XP ni badge, et la file rejouera l'action au retour de la connexion.
 */
export async function avecRepli<T>(
  appel: () => Promise<T>,
  repli: OfflineAction,
): Promise<T | null> {
  try {
    return await appel();
  } catch {
    try { await enqueueAction(repli); } catch { /* IndexedDB ferme : tant pis */ }
    return null;
  }
}

let db: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (db) return Promise.resolve(db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
    };
    req.onsuccess = () => { db = req.result; resolve(db); };
    req.onerror = () => reject(req.error);
  });
}

export async function enqueueAction(action: OfflineAction): Promise<void> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE, "readwrite");
    tx.objectStore(STORE).add({ ...action, createdAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPendingActions(): Promise<(OfflineAction & { id: number })[]> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteAction(id: number): Promise<void> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearAllActions(): Promise<void> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE, "readwrite");
    tx.objectStore(STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
