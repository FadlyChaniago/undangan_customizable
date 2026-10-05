# Undangan Studio — Online Invitation Builder

Builder undangan digital berbasis Vue 3 + Vite. Alur: **Pilih → Klik → Edit → Preview → Simpan**.

## Menjalankan

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # hasil produksi di dist/
```

Dependency hanya `vue` (runtime) dan `vite` + `@vitejs/plugin-vue` (dev).

## Arsitektur singkat

- **Satu sumber data**: `src/composables/useInvitation.js` (state reaktif + tema efektif + CSS variables). Semua editor menulis ke sana, semua komponen undangan membaca darinya.
- **Tema = konfigurasi**: `src/data/themes.js`. Komponen tidak mengenal nama tema; semua variasi datang dari config (warna, font, pola, partikel, ornamen, gaya section).
- **Storage service**: `src/services/storage.js` (LocalStorage + IndexedDB untuk audio) dan `rsvpService.js`. Semua method punya bentuk yang sama dengan API backend sehingga mudah diganti.

## Yang diubah untuk menambah…

| Tujuan | File |
| --- | --- |
| Tema baru | tambah satu objek di `src/data/themes.js` |
| Font baru | tambah satu entri di `src/data/fonts.js` |
| Pola latar baru | tambah fungsi di `src/data/patterns.js`, rujuk dari `pattern.id` tema |
| Bentuk partikel / ornamen baru | `src/components/invitation/fx/shapes.js`, `ornaments/` |
| Section undangan baru | buat komponen, daftarkan di `src/data/sections.js` (+ default di `data/defaults.js`) |
| Panel editor baru | buat komponen, daftarkan di `src/data/editorPanels.js` |
| Field data baru | `src/data/defaults.js` (bentuk data) lalu field di editor terkait |
| Backend (publish, auth, RSVP API) | ganti isi `services/storage.js` dan `services/rsvpService.js` |
