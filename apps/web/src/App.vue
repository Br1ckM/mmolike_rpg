<script setup lang="ts">
import { onMounted } from 'vue';
import { useUIStore } from './stores/ui';
import CharacterCreationModal from './components/creation/CharacterCreationModal.vue';
import { usePlayerStore } from './stores/player';
import { useGameStore } from './stores/game';
import { useHubStore } from './stores/hub';
import { useSettingsStore } from './stores/settings';
import { usePartyStore } from './stores/party';
import { App } from 'mmolike_rpg-application';

// --- IMPORTS for Toast ---
import Toast from '@/volt/Toast.vue';
import { useToast } from 'primevue/usetoast';
const toast = useToast();
// --- END IMPORTS ---

onMounted(async () => {
  const uiStore = useUIStore();
  const saveDataExists = localStorage.getItem('player_save_exists');

  // --- Subscribe to Global Notifications and show Toast ---
  App.isReady.then(() => {
    App.queries.subscribe<any>('notification', (payload) => {
      if (!payload) return;

      // Map backend type ('success', 'error', 'info') to PrimeVue severity
      let severity = payload.type === 'success' ? 'success' : payload.type === 'error' ? 'error' : 'info';

      toast.add({
        severity: severity,
        summary: severity.charAt(0).toUpperCase() + severity.slice(1),
        detail: payload.message,
        life: 3000 // Toast disappears after 3 seconds
      });
    });
  });
  // --- END SUBSCRIPTION ---

  if (!saveDataExists) {
    // If no save data, just show the creation modal.
    uiStore.displayCharacterCreation();
  } else {
    // If save data exists, run the normal full initialization flow here.
    const settingsStore = useSettingsStore();
    await settingsStore.initialize();

    usePlayerStore().initialize();
    useGameStore().initialize();
    useHubStore().initialize();
    usePartyStore().initialize();
  }
});
</script>

<template>
  <RouterView />
  <CharacterCreationModal />
  <!-- Global Toast Container - This component from PrimeVue is styled by Volt. -->
  <Toast position="bottom-right" />
</template>
