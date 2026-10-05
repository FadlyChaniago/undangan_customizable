import { computed, ref } from 'vue';
import { rsvpService } from '../services/rsvpService';

const entries = ref([]);
const loaded = ref(false);

async function load() {
  entries.value = await rsvpService.list();
  loaded.value = true;
}

/** State RSVP bersama (form di undangan + ringkasan di editor). */
export function useRsvp() {
  if (!loaded.value) load();

  const stats = computed(() => {
    const attending = entries.value.filter((e) => e.attendance === 'hadir');
    return {
      total: entries.value.length,
      attending: attending.length,
      declined: entries.value.length - attending.length,
      guests: attending.reduce((sum, e) => sum + e.guests, 0),
    };
  });

  return {
    entries,
    stats,
    reload: load,
    async submit(payload) {
      const entry = await rsvpService.submit(payload);
      entries.value = [entry, ...entries.value];
      return entry;
    },
    async clear() {
      await rsvpService.clear();
      entries.value = [];
    },
  };
}
