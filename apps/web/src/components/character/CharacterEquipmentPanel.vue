<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { usePlayerStore } from '@/stores/player';
import { storeToRefs } from 'pinia';

type EquipmentSlotKey =
  | 'helm' | 'cape' | 'amulet' | 'armor' | 'belt' | 'gloves'
  | 'mainHand' | 'offHand'
  | 'ring1' | 'ring2'
  | 'boots'
  | 'charm1' | 'charm2' | 'charm3';

const SLOTS: EquipmentSlotKey[] = [
  'helm', 'cape', 'amulet', 'armor', 'belt', 'gloves',
  'mainHand', 'offHand', 'ring1', 'ring2',
  'boots', 'charm1', 'charm2', 'charm3'
];

const slotLabel: Record<EquipmentSlotKey, string> = {
  helm: 'Helm', cape: 'Cape', amulet: 'Amulet', armor: 'Armor', belt: 'Belt', gloves: 'Gloves',
  mainHand: 'MainHand', offHand: 'OffHand',
  ring1: 'Ring1', ring2: 'Ring2',
  boots: 'Boots',
  charm1: 'Charm1', charm2: 'Charm2', charm3: 'Charm3',
};

const defaultIcon: Record<EquipmentSlotKey, string> = {
  helm: 'pi pi-crown',
  armor: 'pi pi-book',
  gloves: 'pi pi-box',
  boots: 'pi pi-send',
  mainHand: 'pi pi-bolt',
  offHand: 'pi pi-shield-fill',
  cape: 'pi pi-star-fill',
  amulet: 'pi pi-briefcase',
  belt: 'pi pi-tag',
  ring1: 'pi pi-circle-fill',
  ring2: 'pi pi-circle-fill',
  charm1: 'pi pi-heart-fill',
  charm2: 'pi pi-heart-fill',
  charm3: 'pi pi-heart-fill',
};

const getSlotPosition = (slot: EquipmentSlotKey) => {
  switch (slot) {
    // Center
    case 'helm': return { top: '15%', left: '50%' };
    case 'armor': return { top: '35%', left: '50%' };
    case 'belt': return { top: '55%', left: '50%' };
    case 'boots': return { top: '80%', left: '50%' };
    // Left
    case 'mainHand': return { top: '40%', left: '30%' };
    case 'gloves': return { top: '55%', left: '15%' };
    case 'cape': return { top: '15%', left: '25%' };
    case 'ring1': return { top: '65%', left: '30%' };
    // Right
    case 'offHand': return { top: '40%', left: '75%' };
    case 'amulet': return { top: '15%', left: '80%' };
    case 'ring2': return { top: '65%', left: '70%' };
    // Charms
    case 'charm1': return { top: '85%', left: '70%' };
    case 'charm2': return { top: '85%', left: '80%' };
    case 'charm3': return { top: '85%', left: '90%' };
  }
};

const playerStore = usePlayerStore();
const { player } = storeToRefs(playerStore);

type EquippedViewEntry = { id: string; name: string; icon: string; stats?: string } | null;
type EquippedView = Record<EquipmentSlotKey, EquippedViewEntry>;

/** Build a simple view-model from the actual player equipment */
const equipped = computed<EquippedView>(() => {
  const eq = (player.value?.equipment ?? {}) as Partial<Record<EquipmentSlotKey, string | null>>;
  return SLOTS.reduce((acc, key) => {
    const id = eq[key] ?? null;
    // NOTE: This currently uses placeholder names. When the backend provides full item
    // details for equipped items, this can be updated to show real names.
    acc[key] = id ? { id, name: `Item ${id}`, icon: defaultIcon[key] } : null;
    return acc;
  }, {} as EquippedView);
});

const equipmentSlots = computed(() => SLOTS);

// --- Context menu state/handlers ---
const contextMenuVisible = ref(false);
const contextMenuPosition = ref({ x: 0, y: 0 });
const activeSlot = ref<EquipmentSlotKey | null>(null);

const showContextMenu = (event: MouseEvent, slot: EquipmentSlotKey) => {
  event.preventDefault();
  if (!equipped.value[slot]) return; // only show when something is equipped
  contextMenuPosition.value = { x: event.clientX, y: event.clientY };
  activeSlot.value = slot;
  contextMenuVisible.value = true;
};

const hideContextMenu = () => {
  contextMenuVisible.value = false;
  activeSlot.value = null;
};

const handleMenuAction = (action: 'unequip' | 'inspect') => {
  if (!activeSlot.value) return;
  const slot = activeSlot.value;

  if (action === 'unequip') {
    // Wire this to your command bus when ready:
    // App.commands.unequipItem(player.value!.id, slot);
    console.log(`Unequip requested for ${slotLabel[slot]} (id: ${equipped.value[slot]?.id})`);
  } else {
    console.log(`Inspect requested for ${slotLabel[slot]} (id: ${equipped.value[slot]?.id})`);
    // Open modal/panel with item details here
  }

  hideContextMenu();
};

onMounted(() => window.addEventListener('click', hideContextMenu));
onUnmounted(() => window.removeEventListener('click', hideContextMenu));
</script>

<template>
  <div class="bg-surface-800 rounded-lg shadow-lg p-6 mb-8">
    <h3 class="text-xl font-semibold text-surface-0 mb-4 border-b border-surface-700 pb-2">Equipment</h3>

    <div class="relative w-full h-[450px] overflow-visible">
      <svg class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-70" width="120"
        height="350" viewBox="0 0 120 350" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="60" cy="30" r="25" fill="#3f3f46" />
        <rect x="35" y="55" width="50" height="150" rx="10" fill="#3f3f46" />
        <path d="M85 75L110 95V150L85 130V75Z" fill="#3f3f46" />
        <path d="M35 75L10 95V150L35 130V75Z" transform="scale(-1, 1) translate(-120, 0)" fill="#3f3f46" />
        <rect x="40" y="200" width="40" height="150" rx="5" fill="#3f3f46" />
      </svg>

      <div v-for="slot in equipmentSlots" :key="slot"
        class="absolute z-10 group text-center text-surface-500 transform -translate-x-1/2 -translate-y-1/2 w-20 h-24"
        :style="getSlotPosition(slot)">
        <div @contextmenu="showContextMenu($event, slot)" :class="[
          'w-16 h-16 mx-auto rounded-lg flex items-center justify-center p-1 relative transition-all duration-150 shadow-md cursor-pointer',
          equipped[slot]
            ? 'bg-surface-700 border-2 border-primary-400 shadow-xl shadow-primary-500/30'
            : 'bg-surface-800/80 border border-dashed border-surface-600 hover:border-surface-400'
        ]">
          <i v-if="!equipped[slot]" :class="defaultIcon[slot]" class="text-3xl text-surface-500" />
          <div v-else class="w-full h-full flex flex-col items-center justify-center">
            <i :class="equipped[slot]!.icon" class="text-3xl text-primary-400" />
            <p class="text-[10px] leading-tight text-surface-0 font-semibold px-1 truncate w-full">
              {{ equipped[slot]!.name }}
            </p>
          </div>
        </div>

        <p
          class="mt-2 h-5 text-xs font-semibold text-surface-400 opacity-80 group-hover:text-surface-0 transition-colors">
          <span :class="equipped[slot] ? 'invisible' : ''">{{ slotLabel[slot] }}</span>
        </p>

        <div class="absolute left-1/2 bottom-full mb-2 hidden group-hover:block w-max z-20 transform -translate-x-1/2
                 bg-surface-900 text-surface-200 text-xs rounded-md px-3 py-1 shadow-xl border border-primary-400">
          <template v-if="equipped[slot]">
            <p class="font-bold text-primary-400">{{ equipped[slot]!.name }}</p>
            <p class="text-surface-200">
              id: {{ equipped[slot]!.id }}
            </p>
          </template>
          <template v-else>
            <p class="text-surface-400 font-semibold">Empty Slot: {{ slotLabel[slot] }}</p>
            <p class="text-surface-500 italic">Click to equip item.</p>
          </template>
        </div>
      </div>
    </div>

    <div v-if="contextMenuVisible" :style="{ top: `${contextMenuPosition.y}px`, left: `${contextMenuPosition.x}px` }"
      class="fixed bg-surface-700 rounded-lg shadow-2xl border border-surface-600 z-50 py-1 min-w-40">
      <button @click.stop="handleMenuAction('unequip')"
        class="w-full text-left px-3 py-1.5 text-surface-200 hover:bg-surface-600 transition-colors duration-100 flex items-center gap-2">
        <i class="pi pi-times-circle text-red-400 text-sm"></i> Unequip
      </button>
      <button @click.stop="handleMenuAction('inspect')"
        class="w-full text-left px-3 py-1.5 text-surface-200 hover:bg-surface-600 transition-colors duration-100 flex items-center gap-2">
        <i class="pi pi-search text-sky-400 text-sm"></i> Inspect
      </button>
    </div>
  </div>
</template>