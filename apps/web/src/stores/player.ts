import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { App } from 'mmolike_rpg-application'; // Assuming you have a path alias for your packages

// Define a type for the player state DTO for better type safety
interface PlayerState {
  id: number;
  name: string;
  health: { current: number; max: number };
  derivedStats: any;
  // Add other properties from the DTO as needed
}

export const usePlayerStore = defineStore('player', () => {
  // --- State ---
  const player = ref<PlayerState | null>(null);
  const unsubscribe = ref<(() => void) | null>(null);

  // --- Getters ---
  const healthPercentage = computed(() => {
    if (!player.value || !player.value.health) return 0;
    return (player.value.health.current / player.value.health.max) * 100;
  });

  // --- Actions ---
  async function initialize() {
    // Wait for the application to be fully loaded before subscribing.
    await App.isReady;

    if (unsubscribe.value) {
      unsubscribe.value();
    }
    unsubscribe.value = App.queries.subscribe<PlayerState>('playerState', (newPlayerState) => {
      player.value = newPlayerState;
    });
  }

  // Example action that calls the command service
  function equipItem(itemId: number) {
    if (!player.value) return;
    App.commands.equipItem(player.value.id, itemId);
  }

  return {
    player,
    healthPercentage,
    initialize,
    equipItem,
  };
});