/**
 * Storage service untuk konfigurasi undangan.
 *
 * Implementasi sekarang: LocalStorage (JSON) + IndexedDB (file audio, karena terlalu besar
 * untuk LocalStorage). Untuk pindah ke backend, ganti isi objek `storage` dengan pemanggilan API
 * yang memiliki bentuk yang sama; komponen dan composable tidak perlu diubah.
 *
 *   loadConfig()          -> object | null              (sinkron, agar render pertama sudah benar)
 *   loadAudio()           -> Promise<Blob | null>
 *   save(config, audio)   -> Promise<void>              (audio: Blob | null (hapus) | undefined (tetap))
 *   clear()               -> Promise<void>
 */
const CONFIG_KEY = 'undangan-online:invitation:v1';
const DB_NAME = 'undangan-online';
const STORE = 'media';
const AUDIO_KEY = 'audio';

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB tidak tersedia.'));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idb(mode, run) {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const request = run(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(request?.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export const storage = {
  loadConfig() {
    try {
      const raw = localStorage.getItem(CONFIG_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  async loadAudio() {
    try {
      return (await idb('readonly', (s) => s.get(AUDIO_KEY))) || null;
    } catch {
      return null;
    }
  },

  async save(config, audio) {
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    } catch (e) {
      const full = e?.name === 'QuotaExceededError';
      throw new Error(full ? 'Penyimpanan browser penuh. Kurangi jumlah/ukuran foto lalu coba lagi.' : 'Gagal menyimpan ke LocalStorage.');
    }
    if (audio === undefined) return;
    try {
      await idb('readwrite', (s) => (audio ? s.put(audio, AUDIO_KEY) : s.delete(AUDIO_KEY)));
    } catch {
      throw new Error('Konfigurasi tersimpan, tetapi file musik gagal disimpan (ukuran terlalu besar atau mode privat).');
    }
  },

  async clear() {
    try {
      localStorage.removeItem(CONFIG_KEY);
    } catch {
      /* diabaikan */
    }
    try {
      await idb('readwrite', (s) => s.delete(AUDIO_KEY));
    } catch {
      /* diabaikan */
    }
  },
};
