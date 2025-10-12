import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { App } from 'mmolike_rpg-application/core';
import { PlayerService } from 'mmolike_rpg-application/domains/player';

/**
 * UI-specific Types
 * These interfaces define the shape of data used by Vue components
 */
export type UIVoreRole = 'Neither' | 'Prey' | 'Predator' | 'Both';

const rarityOrder: { [key: string]: number } = {
  'Legendary': 6,
  'Epic': 5,
  'Rare': 4,
  'Uncommon': 3,
  'Common': 2,
  'Junk': 1,
};

export interface UIItem {
  id: number;
  name: string;
  icon: string;
  iconUrl?: string;
  stackSize?: number;
  maxStack?: number;
  quality: string;
  type: string;
  itemLevel?: number;
  level?: number;
  baseStats?: { [key: string]: number };
  affixes?: { name: string; type: 'prefix' | 'suffix'; effects: { stat: string, value: number }[] }[];
  modSlots?: ('filled' | 'empty')[];
  modSlotsCount?: number;
  equipmentSlot?: string;
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
  // Add equippedItems coming from GameService.getPlayerState()
  equippedItems?: { [key: string]: any };
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

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

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
  const equippedItemsData = ref<{ [key: string]: any }>({});


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

  const inventoryFilterText = ref('');
  const inventorySortBy = ref<'default' | 'name' | 'type' | 'rarity'>('default');

  // --- NEW ACTIONS ---
  function setInventoryFilter(text: string) {
    inventoryFilterText.value = text.toLowerCase();
  }
  function setInventorySort(sortBy: 'default' | 'name' | 'type' | 'rarity') {
    inventorySortBy.value = sortBy;
  }
  function clearInventorySortAndFilter() {
    inventoryFilterText.value = '';
    inventorySortBy.value = 'default';
  }

  const bags = computed((): UIBag[] => {
    if (!inventory.value?.bags) return [];
    return inventory.value.bags.map((bagData: any) => {
      return {
        id: bagData.id,
        name: bagData.ItemInfoComponent?.name ?? 'Bag',
        slots: bagData.SlotsComponent?.size ?? 0,
        items: (bagData.items ?? []).map((itemData: any | null): UIItem | null => {
          if (!itemData) return null;

          const mods = itemData.ModsComponent?.modIds || [];
          const modSlotsCount = itemData.ModSlotsComponent?.count || 0;
          const modSlots: ('filled' | 'empty')[] = [];
          for (let i = 0; i < modSlotsCount; i++) {
            modSlots.push(i < mods.length ? 'filled' : 'empty');
          }

          const iconName = itemData.ItemInfoComponent?.iconName?.toLowerCase() || 'box';

          return {
            id: itemData.id,
            name: itemData.ItemInfoComponent?.name ?? 'Item',
            icon: `pi pi-${iconName}`,
            iconUrl: itemData.ItemInfoComponent?.iconUrl, // Add iconUrl if available from backend
            quality: capitalize(itemData.ItemInfoComponent?.rarity ?? 'common'),
            type: itemData.ItemInfoComponent?.itemType ?? 'unknown',
            itemLevel: itemData.ItemInfoComponent?.level || 1, // Use actual level from backend
            level: itemData.ItemInfoComponent?.level || 1, // Add level property
            stackSize: itemData.StackableComponent?.current,
            maxStack: itemData.StackableComponent?.maxStack,
            baseStats: itemData.EquipableComponent?.baseStats ?? {},
            affixes: itemData.AffixesComponent ?? [],
            modSlots: modSlots,
            modSlotsCount: modSlotsCount,
            equipmentSlot: itemData.EquipableComponent?.slot,
            ...itemData,
          };
        }),
      };
    });
  });


  const displayBags = computed((): UIBag[] => {
    // If no sort or filter, return the original bags
    if (inventorySortBy.value === 'default' && inventoryFilterText.value === '') {
      return bags.value;
    }

    // 1. Flatten all items from all bags into a single list
    let allItems: (UIItem | null)[] = bags.value.flatMap(bag => bag.items);

    // 2. Apply filtering
    if (inventoryFilterText.value) {
      allItems = allItems.filter(item =>
        item &&
        (item.name.toLowerCase().includes(inventoryFilterText.value) ||
          item.type.toLowerCase().includes(inventoryFilterText.value))
      );
    }

    // 3. Apply sorting
    if (inventorySortBy.value !== 'default') {
      allItems.sort((a, b) => {
        if (!a) return 1;
        if (!b) return -1;
        switch (inventorySortBy.value) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'type':
            return a.type.localeCompare(b.type);
          case 'rarity':
            return (rarityOrder[b.quality] || 0) - (rarityOrder[a.quality] || 0);
          default:
            return 0;
        }
      });
    }

    // 4. Re-bucket the processed items back into bag structures
    const newBags = JSON.parse(JSON.stringify(bags.value)); // Deep copy structure
    let currentItemIndex = 0;

    for (const bag of newBags) {
      for (let i = 0; i < bag.slots; i++) {
        if (currentItemIndex < allItems.length) {
          bag.items[i] = allItems[currentItemIndex];
          currentItemIndex++;
        } else {
          bag.items[i] = null; // Fill remaining slots with null
        }
      }
    }
    return newBags;
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
    const equipped: { [slot: string]: UIItem | null } = {};

    // Ensure all expected slots exist in the returned object.
    // Prefer slots provided by backend (equipment), otherwise fall back to a default set.
    const backendSlots = Object.keys(equipment.value || {});
    const defaultSlots = ['helm', 'amulet', 'mainHand', 'armor', 'offHand', 'gloves', 'belt', 'cape', 'ring1', 'boots', 'ring2', 'charm1', 'charm2', 'charm3'];
    const slotList = backendSlots.length ? backendSlots : defaultSlots;
    slotList.forEach(slotKey => (equipped[slotKey] = null));

    // Populate equipped slots with full UIItem data when available
    Object.entries(equippedItemsData.value).forEach(([slotType, itemData]) => {
      if (itemData) {
        const iconName = itemData.ItemInfoComponent?.iconName?.toLowerCase() || 'box';

        equipped[slotType] = {
          id: itemData.id,
          name: itemData.ItemInfoComponent?.name ?? 'Item',
          icon: `pi pi-${iconName}`,
          iconUrl: itemData.ItemInfoComponent?.iconUrl,
          quality: capitalize(itemData.ItemInfoComponent?.rarity ?? 'common'),
          type: itemData.ItemInfoComponent?.itemType ?? 'unknown',
          level: itemData.ItemInfoComponent?.level || 1,
          baseStats: itemData.EquipableComponent?.baseStats ?? {},
          equipmentSlot: itemData.EquipableComponent?.slot,
          // include original DTO so components/CSS that rely on ItemInfoComponent.rarity work
          ...itemData,
        };
      }
    });

    return equipped;
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

    // Resolve PlayerService (preferred). Fall back to legacy App.queries.subscribe if missing.
    const playerSvc: any = App.playerService ?? (App.getService && App.getService('PlayerService'));

    console.log('[DEBUG - PlayerStore] PlayerService available:', !!playerSvc);
    console.log('[DEBUG - PlayerStore] PlayerService.subscribePlayerState available:', !!(playerSvc && typeof playerSvc.subscribePlayerState === 'function'));

    if (playerSvc && typeof playerSvc.subscribePlayerState === 'function') {
      console.log('[DEBUG - PlayerStore] ==> Setting up player state subscription');
      unsubscribe.value = playerSvc.subscribePlayerState((newState: PlayerState) => {
        console.log('[DEBUG - PlayerStore] ==> Player state update received:', newState);
        if (!newState) {
          // Reset state when player is null
          playerId.value = null;
          playerName.value = '';
          health.value = { current: 0, max: 1 };
          mana.value = { current: 0, max: 1 };
          progression.value = { level: 1, xp: 0 };
          inventory.value = null;
          equipment.value = {};
          equippedItemsData.value = {}; // <-- reset DTOs
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
        // copy full equipped item DTOs (if provided)
        equippedItemsData.value = newState.equippedItems ?? {};
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
    } else {
      // Legacy fallback
      unsubscribe.value = App.queries.subscribe<PlayerState>('playerState', (newState: PlayerState | null) => {
        if (!newState) {
          // Reset state when player is null
          playerId.value = null;
          playerName.value = '';
          health.value = { current: 0, max: 1 };
          mana.value = { current: 0, max: 1 };
          progression.value = { level: 1, xp: 0 };
          inventory.value = null;
          equipment.value = {};
          equippedItemsData.value = {}; // <-- reset DTOs
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
        // copy full equipped item DTOs (if provided)
        equippedItemsData.value = newState.equippedItems ?? {};
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
  }

  function equipItem(itemId: number) {
    if (!playerId.value) return;
    const playerSvc: any = App.playerService ?? (App.getService && App.getService('PlayerService'));
    if (playerSvc && typeof playerSvc.equipItem === 'function') {
      playerSvc.equipItem(playerId.value, itemId);
      return;
    }
    App.commands.equipItem(playerId.value, itemId);
  }

  function unequipItem(slotId: string) {
    if (!playerId.value) return;
    const playerSvc: any = App.playerService ?? (App.getService && App.getService('PlayerService'));
    if (playerSvc && typeof playerSvc.unequipItem === 'function') {
      playerSvc.unequipItem(playerId.value, slotId);
      return;
    }
    App.commands.unequipItem(playerId.value, slotId);
  }

  function useConsumable(slotIndex: number) {
    if (!playerId.value) return;
    const playerSvc: any = App.playerService ?? (App.getService && App.getService('PlayerService'));
    if (playerSvc && typeof playerSvc.useItemInBelt === 'function') {
      playerSvc.useItemInBelt(playerId.value, slotIndex);
      return;
    }
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
    const playerSvc: any = App.playerService ?? (App.getService && App.getService('PlayerService'));
    if (playerSvc && typeof playerSvc.moveInventoryItem === 'function') {
      playerSvc.moveInventoryItem(playerId.value, source, target);
      return;
    }
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

    // Inventory State

    inventoryFilterText, // <-- Expose state for UI binding
    inventorySortBy, // <-- Expose state for UI binding
    setInventoryFilter,
    displayBags,
    setInventorySort,
    clearInventorySortAndFilter,

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
    unequipItem,
    useConsumable,
    inspectItem,
    closeInspector,
    moveItem,
  };
});