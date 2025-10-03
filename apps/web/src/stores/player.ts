// src/stores/player.ts

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { App } from 'mmolike_rpg-application'; // Assuming you have a path alias for your packages

// Define a type for the player state DTO for better type safety
interface PlayerState {
  id: number;
  name: string;
  health: { current: number; max: number };
  mana: { current: number; max: number }; // Added mana property
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

  // New getter for raw health values (e.g., "95/100")
  const healthValues = computed(() => {
    if (!player.value || !player.value.health) return '0 / 0';
    return `${player.value.health.current} / ${player.value.health.max}`;
  });

  // New getter for mana percentage
  const manaPercentage = computed(() => {
    // Assuming mana is part of the player state now
    if (!player.value || !player.value.mana) return 0;
    return (player.value.mana.current / player.value.mana.max) * 100;
  });

  // New getter for raw mana values (e.g., "40/100")
  const manaValues = computed(() => {
    if (!player.value || !player.value.mana) return '0 / 0';
    return `${player.value.mana.current} / ${player.value.mana.max}`;
  });

  // --- Actions ---
  async function initialize() {
    // Wait for the application to be fully loaded before subscribing.
    await App.isReady;

    if (unsubscribe.value) {
      unsubscribe.value();
    }
    unsubscribe.value = App.queries.subscribe<PlayerState>('playerState', (newPlayerState) => {
      // Temporary stub for health and mana if not provided by the app/backend yet
      if (!newPlayerState.mana) {
        (newPlayerState as any).mana = { current: 50, max: 100 };
      }
      if (!newPlayerState.health) {
        (newPlayerState as any).health = { current: 95, max: 100 };
      }
      if (!newPlayerState.derivedStats) {
        (newPlayerState as any).derivedStats = { level: 1 };
      }

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
    healthValues, // Exposed new getter
    manaPercentage, // Exposed new getter
    manaValues, // Exposed new getter
    initialize,
    equipItem,
  };
});