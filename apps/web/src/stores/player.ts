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

export interface UIItem {
  id: number;
  name: string;
  icon: string;
  stackSize?: number;
  maxStack?: number;
  quality: string;
  type: string;
  [key: string]: any; // Allow other properties
}

export interface UIBag {
  id: number;
  name: string;
  slots: number;
  items: (UIItem | null)[];
}

// Define a type for the player state DTO for better type safety
interface PlayerState {
  id: number;
  name: string;
  health: { current: number; max: number };
  mana: { current: number; max: number };
  coreStats: CoreStats;
  derivedStats: DerivedStats;
  inventory: {
    wallet: { [currency: string]: number };
    bags: any[];
  } | null;
  quests: any[];
}

interface QuestObjective {
  description: string;
  current: number;
  required: number;
  targetName: string;
  requiredAmount: number;
}

interface ActiveQuest {
  id: string;
  name: string;
  objectives: QuestObjective[];
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

  const bags = computed((): UIBag[] => {
    if (!player.value?.inventory?.bags) return [];
    return player.value.inventory.bags.map(bagData => {
      return {
        id: bagData.id,
        name: bagData.ItemInfoComponent.name,
        slots: bagData.SlotsComponent.size,
        items: bagData.items.map((itemData: any | null): UIItem | null => {
          if (!itemData) return null;
          return {
            id: itemData.id,
            name: itemData.ItemInfoComponent.name,
            icon: `pi pi-${itemData.ItemInfoComponent.iconName?.toLowerCase() || 'box'}`,
            quality: itemData.ItemInfoComponent.rarity,
            type: itemData.ItemInfoComponent.itemType,
            stackSize: itemData.StackableComponent?.current, // Note: your component is named 'stackable' in yaml
            maxStack: itemData.StackableComponent?.maxStack,
            ...itemData, // Pass through all data for the inspector
          };
        }),
      };
    });
  });

  const wallet = computed(() => {
    return player.value?.inventory?.wallet ?? { Gold: 0 };
  });

  const belt = computed(() => {
    // This will need a dedicated component on the backend later.
    // For now, we'll keep the mock data to show it.
    const potion: UIItem = { id: 10, name: 'Health Potion', icon: 'pi pi-plus-circle', type: 'consumable', stackSize: 5, maxStack: 10, quality: 'Common' };
    return [potion, null, null, null, null];
  });

  const activeQuests = computed((): ActiveQuest[] => {
    if (!player.value?.quests) return [];

    return player.value.quests
      .filter((quest: any) => quest.status === 'in_progress')
      .map((quest: any) => ({
        id: quest.questId,
        name: quest.info.name,
        objectives: quest.objectives.map((obj: any, index: number) => ({
          description: obj.targetName,
          current: quest.objectiveProgress[index],
          required: obj.requiredAmount,
        })),
      }));
  });
  const totalSlots = computed(() => bags.value.reduce((sum, bag) => sum + bag.slots, 0));
  const usedSlots = computed(() => bags.value.reduce((sum, bag) => sum + bag.items.filter(item => item !== null).length, 0));


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
    totalSlots,
    usedSlots,
    initialize,
    equipItem,
    useConsumable,
    activeQuests,
  };
});