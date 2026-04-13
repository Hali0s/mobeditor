import { snapshot, subscribe } from 'valtio';
import * as THREE from 'three';
import editorStore, { editorActions } from './store';

const DB_NAME = 'fz-editor';
const FILES_STORE = 'files';
const LS_KEY = 'fz-editor-project';

// ── IndexedDB helpers ──────────────────────────────────────────────────────

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(FILES_STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveFileToIDB(assetId: string, blob: Blob): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(FILES_STORE, 'readwrite');
      tx.objectStore(FILES_STORE).put({ id: assetId, blob });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn('saveFileToIDB failed:', e);
  }
}

export async function loadFileFromIDB(assetId: string): Promise<Blob | null> {
  try {
    const db = await openDB();
    return await new Promise<Blob | null>((resolve, reject) => {
      const tx = db.transaction(FILES_STORE, 'readonly');
      const req = tx.objectStore(FILES_STORE).get(assetId);
      req.onsuccess = () => resolve(req.result?.blob ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('loadFileFromIDB failed:', e);
    return null;
  }
}

export async function clearAllFilesFromIDB(): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(FILES_STORE, 'readwrite');
      tx.objectStore(FILES_STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn('clearAllFilesFromIDB failed:', e);
  }
}

// ── THREE reconstruction helpers ───────────────────────────────────────────

function toVector3(v: any): THREE.Vector3 {
  if (!v) return new THREE.Vector3(0, 0, 0);
  const x = v.x ?? v._x ?? 0;
  const y = v.y ?? v._y ?? 0;
  const z = v.z ?? v._z ?? 0;
  return new THREE.Vector3(x, y, z);
}

function toEuler(e: any): THREE.Euler {
  if (!e) return new THREE.Euler(0, 0, 0);
  const x = e.x ?? e._x ?? 0;
  const y = e.y ?? e._y ?? 0;
  const z = e.z ?? e._z ?? 0;
  const order = (e.order ?? e._order ?? 'XYZ') as THREE.EulerOrder;
  return new THREE.Euler(x, y, z, order);
}

// ── Serialization ──────────────────────────────────────────────────────────

function serializeClip(clip: any): any {
  return {
    ...clip,
    position: { __t: 'v3', x: clip.position?.x ?? 0, y: clip.position?.y ?? 0, z: clip.position?.z ?? 0 },
    rotation: { __t: 'eu', x: clip.rotation?.x ?? 0, y: clip.rotation?.y ?? 0, z: clip.rotation?.z ?? 0, o: clip.rotation?.order ?? clip.rotation?._order ?? 'XYZ' },
    scale: { __t: 'v3', x: clip.scale?.x ?? 4, y: clip.scale?.y ?? 4, z: clip.scale?.z ?? 4 },
  };
}

function serializeAsset(asset: any): any {
  // Strip non-serializable DOM element refs; keep everything else
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { video, audio, image, ...rest } = asset;
  return rest;
}

export function saveProject(): void {
  try {
    const snap = snapshot(editorStore) as any;
    const serializable = {
      ...snap,
      tracks: snap.tracks.map((track: any) => ({
        ...track,
        clips: track.clips.map(serializeClip),
      })),
      assets: Object.fromEntries(
        Object.entries(snap.assets).map(([id, asset]) => [id, serializeAsset(asset)])
      ),
      // Don't persist playing state
      playback: { ...snap.playback, isPlaying: false },
    };
    localStorage.setItem(LS_KEY, JSON.stringify(serializable));
  } catch (e) {
    console.warn('saveProject failed:', e);
  }
}

// ── Deserialization ────────────────────────────────────────────────────────

function deserializeClip(clip: any): any {
  const pos = clip.position;
  const rot = clip.rotation;
  const scl = clip.scale;
  return {
    ...clip,
    position: pos?.__t === 'v3' ? new THREE.Vector3(pos.x, pos.y, pos.z) : toVector3(pos),
    rotation: rot?.__t === 'eu' ? new THREE.Euler(rot.x, rot.y, rot.z, (rot.o ?? 'XYZ') as THREE.EulerOrder) : toEuler(rot),
    scale: scl?.__t === 'v3' ? new THREE.Vector3(scl.x, scl.y, scl.z) : toVector3(scl),
  };
}

export async function restoreProject(): Promise<void> {
  const json = localStorage.getItem(LS_KEY);
  if (!json) return;

  try {
    const data = JSON.parse(json);

    // Restore media files from IDB, rebuild blob URLs
    const assetIds = Object.keys(data.assets || {});
    await Promise.all(
      assetIds.map(async (assetId) => {
        const asset = data.assets[assetId];
        if (asset.type === 'video' || asset.type === 'image' || asset.type === 'audio') {
          const blob = await loadFileFromIDB(assetId);
          if (blob) {
            asset.src = URL.createObjectURL(blob);
            asset.loadState = 'loaded';
          } else {
            // File missing — mark as error so clips render as black
            asset.loadState = 'error';
          }
        }
      })
    );

    // Rebuild clips with THREE instances
    data.tracks = data.tracks.map((track: any) => ({
      ...track,
      clips: track.clips.map(deserializeClip),
    }));

    editorActions.loadSnapshot(data);
  } catch (e) {
    console.error('Failed to restore project:', e);
    // Don't crash the app on corrupt data
  }
}

export async function clearPersistedProject(): Promise<void> {
  localStorage.removeItem(LS_KEY);
  await clearAllFilesFromIDB();
}

// ── Auto-save ──────────────────────────────────────────────────────────────

let _saveTimer: ReturnType<typeof setTimeout> | null = null;

export function setupAutoSave(): void {
  subscribe(editorStore, () => {
    // Skip saving during active playback to avoid constant writes
    if (editorStore.playback.isPlaying) return;
    if (_saveTimer) clearTimeout(_saveTimer);
    _saveTimer = setTimeout(saveProject, 1500);
  });
}
