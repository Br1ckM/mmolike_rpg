
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
  strength: number;
  dexterity: number;
  intelligence: number;
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

export interface UISkill {
  id: string;
  name: string;
  description: string;
  type: 'active' | 'passive';
  icon: string;
  rank: number;
}

// Define a type for the player state DTO for better type safety
interface PlayerState {
  id: number;
  name: string;
  health: { current: number; max: number };
  mana: { current: number; max: number };
  coreStats: CoreStats;
  derivedStats: DerivedStats;
  progression: { level: number; xp: number };
  inventory: {
    wallet: { [currency: string]: number };
    bags: any[];
  } | null;
  consumableBelt?: {
    itemIds: (string | null)[];
  };
  quests: any[];
  equipment: { [key: string]: string | null };
  skillBook: { knownSkills: UISkill[] } | null;
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

const xpForLevel = (level: number) => Math.floor(100 * Math.pow(level, 1.5));

export const usePlayerStore = defineStore('player', () => {
  // --- State ---
  const player = ref<PlayerState | null>(null);
  const unsubscribe = ref<(() => void) | null>(null);
  const itemToInspect = ref<UIItem | null>(null);
  const isInspectorOpen = computed(() => itemToInspect.value !== null);

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

  const belt = computed((): (UIItem | null)[] => {
    if (!player.value?.consumableBelt?.itemIds) return Array(5).fill(null);

    const allItemsById = new Map<number, UIItem>();
    bags.value.forEach(bag => {
      bag.items.forEach(item => {
        if (item) {
          allItemsById.set(item.id, item);
        }
      });
    });

    return player.value.consumableBelt.itemIds.map(itemIdStr => {
      if (!itemIdStr) return null;
      const itemId = parseInt(itemIdStr, 10);
      return allItemsById.get(itemId) || null;
    });
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

  // --- NEW XP Getters ---
  const experience = computed(() => {
    const level = player.value?.progression?.level ?? 1;
    const currentXp = player.value?.progression?.xp ?? 0;
    const requiredXp = xpForLevel(level);
    const percentage = requiredXp > 0 ? Math.max(0, Math.min(100, Math.round((currentXp / requiredXp) * 100))) : 0;

    return {
      level,
      current: currentXp,
      required: requiredXp,
      percentage,
      display: `${currentXp} / ${requiredXp}`,
    };
  });

  const allSkills = computed((): UISkill[] => player.value?.skillBook?.knownSkills ?? []);

  const activeSkills = computed(() =>
    allSkills.value.filter(skill => skill.type === 'active')
  );

  const passiveSkills = computed(() =>
    allSkills.value.filter(skill => skill.type === 'passive')
  );

  const equippedItems = computed(() => {
    if (!player.value?.equipment) return [];

    const allItemsById = new Map<number, UIItem>();
    bags.value.forEach(bag => {
      bag.items.forEach(item => {
        if (item) allItemsById.set(item.id, item);
      });
    });

    return Object.values(player.value.equipment)
      .filter((itemId): itemId is string => !!itemId)
      .map(itemId => allItemsById.get(parseInt(itemId, 10)))
      .filter((item): item is UIItem => !!item);
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

  function useConsumable(slotIndex: number) {
    if (!player.value) return;
    // This call is now correct, as the third argument is optional for non-combat use.
    App.commands.useItemInBelt(player.value.id, slotIndex);
  }

  function inspectItem(item: UIItem) {
    itemToInspect.value = item;
  }

  function closeInspector() {
    itemToInspect.value = null;
  }


  return {
    player,
    healthPercentage,
    healthValues,
    manaPercentage,
    manaValues,
    bags,
    wallet,
    belt,
    totalSlots,
    usedSlots,
    activeQuests,
    itemToInspect,
    isInspectorOpen,
    initialize,
    equipItem,
    useConsumable,
    inspectItem,
    closeInspector,
    experience,
    activeSkills,
    passiveSkills,
    equippedItems,
  };
});