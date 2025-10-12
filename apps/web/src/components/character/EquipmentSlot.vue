//
br1ckm/mmolike_rpg/mmolike_rpg-e3815c14253d82f086ebb67b045f10843c5d38d1/apps/web/src/components/character/EquipmentSlot.vue
<script setup lang="ts">
import { ref } from 'vue';
import type { UIItem } from '@/stores/player';
import { usePlayerStore } from '@/stores/player';

const props = defineProps<{
    slotName: string;
    slotType: string;
    item: UIItem | null;
}>();

const playerStore = usePlayerStore();
const isDraggedOver = ref(false);

// --- CLICK HANDLERS (NEW) ---
function handleClick() {
    // Only unequip if there's an item in the slot
    if (props.item) {
        playerStore.unequipItem(props.slotType);
    }
}

function handleRightClick() {
    // Only inspect if there's an item in the slot
    if (props.item) {
        playerStore.inspectItem(props.item);
    }
}
// --- END CLICK HANDLERS ---

function handleDrop(event: DragEvent) {
    isDraggedOver.value = false;
    if (!event.dataTransfer) return;

    const payloadJSON = event.dataTransfer.getData('application/json');
    if (!payloadJSON) return;

    const payload = JSON.parse(payloadJSON);
    const { itemId, itemSlotType } = payload;

    const isCompatible =
        itemSlotType === props.slotType ||
        (itemSlotType === 'ring' && (props.slotType === 'ring1' || props.slotType === 'ring2')) ||
        (itemSlotType === 'charm' && (props.slotType.startsWith('charm')));

    if (itemId && isCompatible) {
        playerStore.equipItem(itemId);
    } else {
        console.warn(`Attempted to drop item of type '${itemSlotType}' into incompatible slot '${props.slotType}'.`);
    }
}

function handleDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move';
    }
}
</script>

<template>
    <div class="group relative w-20 h-20 bg-surface-700/50 rounded-lg flex items-center justify-center border-2 transition-all duration-150"
        :class="{
            'border-dashed border-surface-600': !item,
            'border-solid border-surface-600 cursor-pointer': item,
            'border-primary-400 bg-primary-500/10 scale-105': isDraggedOver
        }" @drop.prevent="handleDrop" @dragover.prevent="handleDragOver" @dragenter.prevent="isDraggedOver = true"
        @dragleave.prevent="isDraggedOver = false" @click="handleClick" @contextmenu.prevent="handleRightClick">

        <template v-if="item">
            <!-- Try iconUrl first, then fall back to icon class -->
            <img v-if="item.iconUrl" :src="item.iconUrl" :alt="item.name" class="w-12 h-12 object-contain" />
            <i v-else-if="item.icon" :class="item.icon" class="text-2xl text-surface-300"></i>
            <span v-else class="text-4xl text-surface-500">?</span>

            <div class="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full w-max max-w-xs
                        bg-surface-800 p-2 rounded-md shadow-lg border border-surface-600
                        opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <p class="font-bold text-primary-400">{{ item.name }}</p>
                <p v-if="item.level" class="text-xs text-surface-400 italic">Level {{ item.level }}</p>
            </div>
        </template>
        <template v-else>
            <span class="text-surface-500 text-xs font-semibold">{{ slotName }}</span>
        </template>
    </div>
</template>