<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useUIStore } from './stores/ui';
import CharacterCreationModal from './components/creation/CharacterCreationModal.vue';
import { usePlayerStore } from './stores/player';
import { useGameStore } from './stores/game';
import { useHubStore } from './stores/hub';
import { useSettingsStore } from './stores/settings';
import { usePartyStore } from './stores/party';
import { App } from 'mmolike_rpg-application';
import { storeToRefs } from 'pinia';

// --- IMPORTS for Toast ---
import Toast from '@/volt/Toast.vue';
import { useToast } from 'primevue/usetoast';
const toast = useToast();
// --- END IMPORTS ---

let autoSaveInterval: number | undefined;

onMounted(async () => {
  const uiStore = useUIStore();
  const settingsStore = useSettingsStore();
  const { autoSaveEnabled } = storeToRefs(settingsStore);

  // Watch for changes to the auto-save setting
  watch(autoSaveEnabled, (newValue) => {
    if (newValue) {
      startAutoSave();
    } else {
      stopAutoSave();
    }
  });

  // Subscribe to Global Notifications and show Toast
  App.isReady.then(() => {
    App.queries.subscribe<any>('notification', (payload) => {
      if (!payload) return;

      const severity = payload.type === 'success' ? 'success' : payload.type === 'error' ? 'error' : 'info';

      toast.add({
        severity: severity,
        summary: severity.charAt(0).toUpperCase() + severity.slice(1),
        detail: payload.message,
        life: 3000
      });
    });
  });

  await settingsStore.initialize();

  const saveDataExists = localStorage.getItem('player_save_exists');

  if (!saveDataExists) {
    uiStore.displayCharacterCreation();
  } else {
    // --- AUTO-LOAD ---
    App.commands.loadGame();

    // Initialize all stores to sync with the loaded data
    usePlayerStore().initialize();
    useGameStore().initialize();
    useHubStore().initialize();
    usePartyStore().initialize();
  }

  // Start auto-save if enabled on boot
  if (autoSaveEnabled.value) {
    startAutoSave();
  }
});

function startAutoSave() {
  if (autoSaveInterval) clearInterval(autoSaveInterval);
  autoSaveInterval = setInterval(() => {
    App.commands.saveGame();
  }, 60000); // 60 seconds
  console.log("Auto-save started.");
}

function stopAutoSave() {
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
    autoSaveInterval = undefined;
    console.log("Auto-save stopped.");
  }
}
</script>

<template>
  <RouterView />
  <CharacterCreationModal />
  <Toast position="bottom-right" />
</template>