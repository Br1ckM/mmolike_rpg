// src/stores/player.ts

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { App } from 'mmolike_rpg-application';

type DerivedStats = {
  attack: number;
  magicAttack: number;
  defense: number;
  magicResist: number;
  critChance: number;
  critDamage: number;
  dodge: number;
  haste: number;
  accuracy: number;
}

type CoreStats = {
  STR: number;
  DEX: number;
  INT: number;
}

// Define a type for the player state DTO for better type safety
interface PlayerState {
  id: number;
  name: string;
  health: { current: number; max: number };
  mana: { current: number; max: number };
  coreStats: CoreStats;
  derivedStats: DerivedStats;
  inventory?: { bagIds: string[]; walletId: string };
}

export const usePlayerStore = defineStore('player', () => {
  // --- State ---
  const player = ref<PlayerState | null>(null);
  const unsubscribe = ref<(() => void) | null>(null);

  // --- Getters ---
  const resolvedHealth = computed(() =>
    player.value?.health ?? { current: 0, max: 0 }
  );

  const resolvedMana = computed(() =>
    player.value?.mana ?? { current: 0, max: 0 }
  );

  const healthPercentage = computed(() => {
    const { current: cur, max } = resolvedHealth.value;
    if (max <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((cur / max) * 100)));
  });

  const healthValues = computed(() => {
    const { current: cur, max } = resolvedHealth.value;
    return { current: cur, max, display: `${cur} / ${max}` };
  });

  const manaPercentage = computed(() => {
    const { current: cur, max } = resolvedMana.value;
    if (max <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((cur / max) * 100)));
  });

  const manaValues = computed(() => {
    const { current: cur, max } = resolvedMana.value;
    return { current: cur, max, display: `${cur} / ${max}` };
  });

  // NEW: INVENTORY GETTERS
  const bags = computed(() => {
    if (!player.value?.inventory?.bagIds) return [];
    // This is a placeholder; you'll need to get the full bag and item details
    // from the world state, which we'll address in a future step.
    // For now, this structure is enough to get the components working.
    return player.value.inventory.bagIds.map((bagId, index) => ({
      id: bagId,
      name: `Bag ${index + 1}`,
      slots: 20, // Placeholder
      items: [], // Placeholder
    }));
  });

  const wallet = computed(() => {
    if (!player.value?.inventory?.walletId) return {};
    // Placeholder - similar to bags
    return { Gold: 0, Silver: 0, Gems: 0 };
  });

  const belt = computed(() => {
    // Placeholder
    return new Array(5).fill(null);
  });

  // --- Actions ---
  async function initialize() {
    await App.isReady;

    if (unsubscribe.value) {
      unsubscribe.value();
    }

    // Subscribe first — QueryService.subscribe immediately calls the callback with the current state
    unsubscribe.value = App.queries.subscribe<PlayerState>('playerState', (newPlayerState) => {
      player.value = newPlayerState;
    });
  }

  function equipItem(itemId: number) {
    if (!player.value) return;
    App.commands.equipItem(player.value.id, itemId);
  }

  // NEW: Add inventory-related actions if needed
  function useConsumable(slotIndex: number) {
    console.log(`Using consumable in belt slot ${slotIndex}`);
    // You would eventually call App.commands.useConsumable here
  }


  return {
    player,
    healthPercentage,
    healthValues,
    manaPercentage,
    manaValues,
    bags, // Expose new getters
    wallet,
    belt,
    initialize,
    equipItem,
    useConsumable,
  };
});