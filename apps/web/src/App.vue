<script setup lang="ts">
import { onMounted } from 'vue';
import { useUIStore } from './stores/ui';
import CharacterCreationModal from './components/creation/CharacterCreationModal.vue';
import { usePlayerStore } from './stores/player';
import { useGameStore } from './stores/game';
import { useHubStore } from './stores/hub';
import { useSettingsStore } from './stores/settings';

onMounted(async () => {
  const uiStore = useUIStore();
  const saveDataExists = localStorage.getItem('player_save_exists');

  if (!saveDataExists) {
    // If no save data, just show the creation modal.
    // The modal itself is now responsible for initializing the stores after creation.
    uiStore.displayCharacterCreation();
  } else {
    // If save data exists, run the normal full initialization flow here.
    const settingsStore = useSettingsStore();
    await settingsStore.initialize();

    usePlayerStore().initialize();
    useGameStore().initialize();
    useHubStore().initialize();
  }
});
</script>

<template>
  <RouterView />
  <CharacterCreationModal />
</template>