import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { App } from 'mmolike_rpg-application';

/**
 * UI-specific Types
 * These interfaces define the shape of data used by Vue components
 */
export type UIVoreRole = 'Neither' | 'Prey' | 'Predator' | 'Both';

export interface UIItem {
  id: number;
  name: string;
  icon: string;
  stackSize?: number;
  maxStack?: number;
  quality: string;
  type: string;
  [key: string]: any;
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

export interface UIAppearanceAttribute {
  label: string;
  value: string | number;
  unit?: string;
}

export interface UIStomachContent {
  name: string;
  digestionTimer: number;
  voreType?: string;
}

/**
 * Backend Data Structures
 * These interfaces match the data received from the application layer
 */
interface PlayerState {
  id: number;
  name: string;
  health: { current: number; max: number };
  mana: { current: number; max: number };
  coreStats: { strength: number; dexterity: number; intelligence: number };
  derivedStats: { [key: string]: number };
  progression: { level: number; xp: number };
  inventory: {
    wallet: { [currency: string]: number };
    bags: any[];
  } | null;
  consumableBelt?: { itemIds: (string | null)[] };
  quests: any[];
  equipment: { [key: string]: string | null };
  skillBook: { knownSkills: UISkill[] } | null;
  AppearanceComponent?: { attributes: { name: string, value: string | number, label: string, unit?: string }[] };
  VoreRoleComponent?: { role: UIVoreRole };
  vore?: { contents: UIStomachContent[] };
  ancestry?: any;
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

/**
 * Calculate experience required for a given level
 */
const xpForLevel = (level: number) => Math.floor(100 * Math.pow(level, 1.5));

/**
 * Player Store
 * Manages all player-related state and provides computed getters and actions
 */
export const usePlayerStore = defineStore('player', () => {
  // State Management
  const isInitialized = ref(false);
  const unsubscribe = ref<(() => void) | null>(null);

  // Core Player Data
  const playerId = ref<number | null>(null);
  const playerName = ref('');
  const health = ref({ current: 0, max: 1 });
  const mana = ref({ current: 0, max: 1 });
  const progression = ref({ level: 1, xp: 0 });
  const inventory = ref<{ wallet: any, bags: any[] } | null>(null);
  const equipment = ref<{ [key: string]: string | null }>({});
  const coreStats = ref({ strength: 0, dexterity: 0, intelligence: 0 });
  const derivedStats = ref<{ [key: string]: number }>({});
  const skillBook = ref<{ knownSkills: any[] } | null>(null);
  const consumableBelt = ref<{ itemIds: (string | null)[] } | null>(null);
  const quests = ref<any[]>([]);
  const appearance = ref<{ attributes: any[] } | null>(null);
  const voreRole = ref<UIVoreRole>('Neither');
  const voreContents = ref<any[]>([]);
  const ancestry = ref<any>(null);

  // Inspector State
  const itemToInspect = ref<UIItem | null>(null);
  const isInspectorOpen = computed(() => itemToInspect.value !== null);

  /**
   * Computed Getters
   * These provide reactive calculated values based on the core state
   */
  const healthPercentage = computed(() => (health.value.max > 0 ? (health.value.current / health.value.max) * 100 : 0));
  const healthValues = computed(() => ({ current: health.value.current, max: health.value.max, display: `${health.value.current} / ${health.value.max}` }));
  const manaPercentage = computed(() => (mana.value.max > 0 ? (mana.value.current / mana.value.max) * 100 : 0));
  const manaValues = computed(() => ({ current: mana.value.current, max: mana.value.max, display: `${mana.value.current} / ${mana.value.max}` }));

  const experience = computed(() => {
    const level = progression.value.level ?? 1;
    const currentXp = progression.value.xp ?? 0;
    const requiredXp = xpForLevel(level);
    const percentage = requiredXp > 0 ? Math.max(0, Math.min(100, Math.round((currentXp / requiredXp) * 100))) : 0;
    return { level, current: currentXp, required: requiredXp, percentage, display: `${currentXp} / ${requiredXp}` };
  });

  const bags = computed((): UIBag[] => {
    if (!inventory.value?.bags) return [];
    return inventory.value.bags.map((bagData: any) => {
      return {
        id: bagData.id,
        name: bagData.ItemInfoComponent?.name ?? 'Bag',
        slots: bagData.SlotsComponent?.size ?? 0,
        items: (bagData.items ?? []).map((itemData: any | null): UIItem | null => {
          if (!itemData) return null;
          return {
            id: itemData.id,
            name: itemData.ItemInfoComponent?.name ?? 'Item',
            icon: `pi pi-${itemData.ItemInfoComponent?.iconName?.toLowerCase() || 'box'}`,
            quality: itemData.ItemInfoComponent?.rarity ?? 'common',
            type: itemData.ItemInfoComponent?.itemType ?? 'unknown',
            stackSize: itemData.StackableComponent?.current,
            maxStack: itemData.StackableComponent?.maxStack,
            ...itemData,
          };
        }),
      };
    });
  });

  const wallet = computed(() => inventory.value?.wallet ?? { Gold: 0 });

  const belt = computed((): (UIItem | null)[] => {
    if (!consumableBelt.value?.itemIds) return Array(5).fill(null);
    const allItemsById = new Map<number, UIItem>();
    bags.value.forEach(bag => {
      bag.items.forEach(item => {
        if (item) {
          allItemsById.set(item.id, item);
        }
      });
    });
    return consumableBelt.value.itemIds.map(itemIdStr => {
      if (!itemIdStr) return null;
      const itemId = parseInt(itemIdStr, 10);
      return allItemsById.get(itemId) || null;
    });
  });

  const activeQuests = computed((): ActiveQuest[] => {
    return quests.value
      .filter((quest: any) => quest.status === 'in_progress')
      .map((quest: any) => ({
        id: quest.questId,
        name: quest.info?.name ?? 'Quest',
        objectives: (quest.objectives ?? []).map((obj: any, index: number) => ({
          description: obj.targetName,
          current: quest.objectiveProgress?.[index] ?? 0,
          required: obj.requiredAmount,
        })),
      }));
  });

  const totalSlots = computed(() => bags.value.reduce((sum, bag) => sum + bag.slots, 0));
  const usedSlots = computed(() => bags.value.reduce((sum, bag) => sum + bag.items.filter(item => item !== null).length, 0));

  const allSkills = computed((): UISkill[] => skillBook.value?.knownSkills ?? []);
  const activeSkills = computed(() => allSkills.value.filter(skill => skill.type === 'active'));
  const passiveSkills = computed(() => allSkills.value.filter(skill => skill.type === 'passive'));

  const equippedItems = computed(() => {
    if (!equipment.value) return [];
    const allItemsById = new Map<number, UIItem>();
    bags.value.forEach(bag => {
      bag.items.forEach(item => {
        if (item) allItemsById.set(item.id, item);
      });
    });
    return Object.values(equipment.value)
      .filter((itemId): itemId is string => !!itemId)
      .map(itemId => allItemsById.get(parseInt(itemId, 10)))
      .filter((item): item is UIItem => !!item);
  });

  const appearanceAttributes = computed((): UIAppearanceAttribute[] => {
    return (appearance.value?.attributes ?? []).map((attr: any) => ({
      label: attr.label,
      value: attr.value,
      unit: attr.unit
    }));
  });

  const playerVoreRole = computed((): UIVoreRole => voreRole.value ?? 'Neither');
  const stomachContents = computed((): UIStomachContent[] => voreContents.value ?? []);

  /**
   * Actions
   * These functions handle state mutations and backend communication
   */

  /**
   * Initialize the store by subscribing to player state updates
   */
  async function initialize() {
    await App.isReady;
    if (unsubscribe.value) unsubscribe.value();

    unsubscribe.value = App.queries.subscribe<PlayerState>('playerState', (newState) => {
      if (!newState) {
        // Reset state when player is null
        playerId.value = null;
        playerName.value = '';
        health.value = { current: 0, max: 1 };
        mana.value = { current: 0, max: 1 };
        progression.value = { level: 1, xp: 0 };
        inventory.value = null;
        equipment.value = {};
        coreStats.value = { strength: 0, dexterity: 0, intelligence: 0 };
        derivedStats.value = {};
        skillBook.value = null;
        consumableBelt.value = null;
        quests.value = [];
        appearance.value = null;
        voreRole.value = 'Neither';
        voreContents.value = [];
        ancestry.value = null;
        return;
      }

      // Update state with new values from backend
      playerId.value = newState.id;
      playerName.value = newState.name;
      health.value.current = newState.health.current;
      health.value.max = newState.health.max;
      mana.value.current = newState.mana.current;
      mana.value.max = newState.mana.max;
      progression.value = newState.progression;
      inventory.value = newState.inventory;
      equipment.value = newState.equipment;
      coreStats.value = newState.coreStats;
      derivedStats.value = newState.derivedStats;
      skillBook.value = newState.skillBook;
      consumableBelt.value = newState.consumableBelt ?? null;
      quests.value = newState.quests ?? [];
      appearance.value = newState.AppearanceComponent ?? null;
      voreRole.value = newState.VoreRoleComponent?.role ?? 'Neither';
      voreContents.value = newState.vore?.contents ?? [];
      ancestry.value = newState.ancestry;

      // Sync persisted vore role on first load
      if (!isInitialized.value) {
        isInitialized.value = true;

        const savedRole = localStorage.getItem('playerVoreRole') as UIVoreRole | null;
        const currentRole = newState.VoreRoleComponent?.role || 'Neither';

        if (savedRole && savedRole !== currentRole) {
          App.commands.setPlayerVoreRole(newState.id, savedRole);
        }
      }
    });
  }

  function equipItem(itemId: number) {
    if (!playerId.value) return;
    App.commands.equipItem(playerId.value, itemId);
  }

  function useConsumable(slotIndex: number) {
    if (!playerId.value) return;
    App.commands.useItemInBelt(playerId.value, slotIndex);
  }

  function inspectItem(item: UIItem) {
    itemToInspect.value = item;
  }

  function closeInspector() {
    itemToInspect.value = null;
  }

  function moveItem(source: { bagId: number, slotIndex: number }, target: { bagId: number, slotIndex: number }) {
    if (!playerId.value) return;
    App.commands.moveInventoryItem(playerId.value, source, target);
  }

  return {
    // Reactive State
    playerId,
    playerName,
    health,
    mana,
    progression,
    inventory,
    equipment,
    coreStats,
    derivedStats,
    skillBook,
    consumableBelt,
    quests,
    appearance,
    voreRole,
    voreContents,
    ancestry,

    // Inspector State
    itemToInspect,
    isInspectorOpen,

    // Computed Getters
    healthPercentage,
    healthValues,
    manaPercentage,
    manaValues,
    experience,
    bags,
    wallet,
    belt,
    totalSlots,
    usedSlots,
    activeQuests,
    allSkills,
    activeSkills,
    passiveSkills,
    equippedItems,
    appearanceAttributes,
    playerVoreRole,
    stomachContents,

    // Actions
    initialize,
    equipItem,
    useConsumable,
    inspectItem,
    closeInspector,
    moveItem,
  };
});