/**
 * Service RSVP. Semua method async agar bisa diganti pemanggilan API tanpa mengubah pemanggil:
 *   list()          -> Promise<Rsvp[]>
 *   submit(entry)   -> Promise<Rsvp>
 *   clear()         -> Promise<void>
 */
const KEY = 'undangan-online:rsvp:v1';

const read = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
};

export const rsvpService = {
  async list() {
    return read();
  },

  async submit({ name, attendance, guests, message }) {
    const entry = {
      id: `rsvp-${Date.now().toString(36)}`,
      name: String(name).trim(),
      attendance,
      guests: attendance === 'hadir' ? Math.max(1, Number(guests) || 1) : 0,
      message: String(message || '').trim(),
      createdAt: new Date().toISOString(),
    };
    if (!entry.name) throw new Error('Nama wajib diisi.');
    try {
      localStorage.setItem(KEY, JSON.stringify([entry, ...read()]));
    } catch {
      throw new Error('Gagal menyimpan RSVP.');
    }
    return entry;
  },

  async clear() {
    localStorage.removeItem(KEY);
  },
};
