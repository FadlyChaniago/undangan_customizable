import { computed, reactive, ref, shallowRef, watchEffect } from 'vue';
import { createDefaultInvitation } from '../data/defaults';
import { fontStack, getFont } from '../data/fonts';
import { patterns } from '../data/patterns';
import { getTheme, themes } from '../data/themes';
import { storage } from '../services/storage';
import { normalizeHex, readableOn } from '../utils/color';
import { assignInPlace, clone, deepMerge, flatten, getPath, isEqual, setPath } from '../utils/object';
import { loadFont } from './useFonts';

/**
 * Single source of truth. Semua editor menulis ke `state`, semua komponen undangan membaca darinya.
 * Dipakai sebagai singleton modul sehingga tidak ada salinan state di komponen.
 */
const state = reactive(deepMerge(createDefaultInvitation(), storage.loadConfig() ?? {}));

const savedSnapshot = ref(JSON.stringify(state));
const audioBlob = shallowRef(null);
const audioUrl = ref('');
const audioChanged = ref(false);

const dirty = computed(() => audioChanged.value || JSON.stringify(state) !== savedSnapshot.value);
const theme = computed(() => getTheme(state.theme));

const setAudioBlob = (blob) => {
  if (audioUrl.value) URL.revokeObjectURL(audioUrl.value);
  audioBlob.value = blob;
  audioUrl.value = blob ? URL.createObjectURL(blob) : '';
};

// Audio kustom tersimpan di IndexedDB; pulihkan saat start.
if (state.music.custom) {
  storage.loadAudio().then((blob) => {
    if (blob) setAudioBlob(blob);
    else state.music.custom = false;
  });
}

/** Nilai efektif: override user, atau default tema. */
const effective = (key) => state.colors[key] || theme.value.colors[key];
const headingFont = computed(() => state.typography.heading || theme.value.fonts.heading);
const bodyFont = computed(() => state.typography.body || theme.value.fonts.body);

watchEffect(() => {
  loadFont(headingFont.value);
  loadFont(bodyFont.value);
});

const glowColor = (c, primary, secondary) => (c === 'primary' ? primary : c === 'secondary' ? secondary : c);

/** CSS variables yang menjadi kontrak antara konfigurasi tema dan seluruh styling undangan. */
const cssVars = computed(() => {
  const t = theme.value;
  const primary = effective('primary');
  const secondary = effective('secondary');
  const bg = effective('background');
  const text = effective('text');
  const headingRole = { text, primary, secondary }[t.headingColor] ?? text;
  const surface = state.colors.background || state.colors.text
    ? `color-mix(in srgb, ${bg} 88%, ${text})`
    : t.colors.surface;

  return {
    '--c-primary': primary,
    '--c-secondary': secondary,
    '--c-bg': bg,
    '--c-text': text,
    '--c-surface': surface,
    '--c-heading': headingRole,
    '--c-muted': `color-mix(in srgb, ${text} 68%, ${bg})`,
    '--c-on-primary': readableOn(primary),
    '--c-on-secondary': readableOn(secondary),
    '--f-heading': fontStack(headingFont.value),
    '--f-body': fontStack(bodyFont.value),
    '--h-scale': getFont(headingFont.value).scale,
    '--pattern-img': (patterns[t.pattern.id] ?? patterns.floral)(primary),
    '--pattern-size': `${t.pattern.size}px`,
    '--pattern-opacity': t.pattern.opacity,
    '--band-img': t.ornaments.band ? patterns.tumpalBand(primary) : 'none',
    '--glow-a': glowColor(t.fx.glow[0], primary, secondary),
    '--glow-b': glowColor(t.fx.glow[1] ?? t.fx.glow[0], primary, secondary),
    ...t.vars,
  };
});

/**
 * Ganti tema. Teks bawaan tema lama yang belum diubah user ikut diganti ke teks bawaan tema baru,
 * sedangkan teks yang sudah diedit user dibiarkan.
 */
function setTheme(id) {
  if (!themes[id] || id === state.theme) return;
  const prev = getTheme(state.theme).copy;
  for (const [path, value] of flatten(themes[id].copy)) {
    const current = getPath(state.content, path);
    if (!isEqual(current, getPath(prev, path))) continue;
    if (Array.isArray(current)) current.splice(0, current.length, ...clone(value));
    else setPath(state.content, path, value);
  }
  state.theme = id;
}

function setAudio(file) {
  if (!file || !file.type.startsWith('audio/')) throw new Error('Pilih file audio (MP3, WAV, OGG, M4A).');
  if (file.size > 15 * 1024 * 1024) throw new Error('Ukuran audio maksimal 15 MB.');
  setAudioBlob(file);
  state.music.custom = true;
  state.music.name = file.name;
  audioChanged.value = true;
}

function removeAudio() {
  setAudioBlob(null);
  state.music.custom = false;
  state.music.name = '';
  audioChanged.value = true;
}

async function save() {
  await storage.save(clone(state), audioChanged.value ? audioBlob.value : undefined);
  savedSnapshot.value = JSON.stringify(state);
  audioChanged.value = false;
}

async function reset() {
  assignInPlace(state, createDefaultInvitation());
  setAudioBlob(null);
  await storage.clear();
  savedSnapshot.value = JSON.stringify(state);
  audioChanged.value = false;
}

export function useInvitation() {
  return {
    state,
    theme,
    cssVars,
    headingFont,
    bodyFont,
    effective,
    audioUrl,
    dirty,
    setTheme,
    setAudio,
    removeAudio,
    save,
    reset,
  };
}
