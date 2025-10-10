// apps/web/src/App.vue

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
import Toast from '@/volt/Toast.vue';
import { useToast } from 'primevue/usetoast';

const toast = useToast();
let autoSaveInterval: number | undefined;

onMounted(async () => {
  const uiStore = useUIStore();
  const settingsStore = useSettingsStore();
  const { autoSaveEnabled } = storeToRefs(settingsStore);

  watch(autoSaveEnabled, (newValue) => {
    if (newValue) {
      startAutoSave();
    } else {
      stopAutoSave();
    }
  });

  await App.isReady;

  // Subscribe to global notifications first
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

  // --- REFACTORED INITIALIZATION LOGIC ---

  // 1. Initialize all stores so their subscriptions are active.
  await settingsStore.initialize();
  await usePlayerStore().initialize();
  await useGameStore().initialize();
  await useHubStore().initialize();
  await usePartyStore().initialize();

  // 2. Now, check for save data and load the game.
  const saveDataExists = localStorage.getItem('player_save_exists');

  if (!saveDataExists) {
    uiStore.displayCharacterCreation();
  } else {
    // By calling loadGame() now, the initialized stores will correctly
    // receive the events emitted during the load process.
    App.commands.loadGame();
  }

  // --- END REFACTOR ---

  if (autoSaveEnabled.value) {
    startAutoSave();
  }
});

function startAutoSave() {
  // ... function remains the same
  if (autoSaveInterval) clearInterval(autoSaveInterval);
  autoSaveInterval = setInterval(() => {
    App.commands.saveGame();
  }, 60000); // 60 seconds
  console.log("Auto-save started.");
}

function stopAutoSave() {
  // ... function remains the same
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