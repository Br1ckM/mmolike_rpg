//
br1ckm/mmolike_rpg/mmolike_rpg-b7e7d77de824d1e8e8ed1813aa329e612229de49/apps/web/src/components/inventory/InventoryBags.vue
<script setup lang="ts">
import InventoryItemSlot from './InventoryItemSlot.vue';
import { usePlayerStore, type UIItem } from '@/stores/player';
import { storeToRefs } from 'pinia';
import ItemInspectorModal from './ItemInspectorModal.vue';
import { ref, computed } from 'vue';

const playerStore = usePlayerStore();
// --- UPDATED: Use displayBags and get sort/filter state ---
const { displayBags, totalSlots, usedSlots, inventorySortBy, inventoryFilterText } = storeToRefs(playerStore);

const isSortOrFilterActive = computed(() => inventorySortBy.value !== 'default' || inventoryFilterText.value !== '');

const draggedOverSlot = ref<{ bagId: number, index: number } | null>(null);

// --- DRAG & DROP LOGIC ---
function onDragStart(event: DragEvent, bagId: number, slotIndex: number) {
    if (isSortOrFilterActive.value) return; // Disable drag
    if (event.dataTransfer) {
        const payload = JSON.stringify({ sourceBagId: bagId, sourceSlotIndex: slotIndex });
        event.dataTransfer.setData('application/json', payload);
        event.dataTransfer.effectAllowed = 'move';
    }
}

function onDrop(event: DragEvent, targetBagId: number, targetSlotIndex: number) {
    if (event.dataTransfer) {
        const payload = event.dataTransfer.getData('application/json');
        if (!payload) return;

        const sourceData = JSON.parse(payload);
        playerStore.moveItem(
            { bagId: sourceData.sourceBagId, slotIndex: sourceData.sourceSlotIndex },
            { bagId: targetBagId, slotIndex: targetSlotIndex }
        );
    }
    draggedOverSlot.value = null; // Clear visual feedback on drop
}

function onDragEnter(bagId: number, index: number) {
    draggedOverSlot.value = { bagId, index };
}
// --- END DRAG & DROP LOGIC ---


const getBagIcon = (bagName: string) => { /* ... unchanged ... */ };

const openInspector = (item: UIItem | null) => {
    if (item) {
        playerStore.inspectItem(item);
    }
};
</script>

<template>
    <div class="h-full flex flex-col">
        <h2 class="text-2xl font-bold text-primary-400 mb-4 border-b border-surface-700 pb-2 flex-shrink-0">
            Bags <span class="text-surface-400 text-lg ml-2">({{ usedSlots }} / {{ totalSlots }} Slots)</span>
        </h2>

        <div class="space-y-8 flex-grow overflow-y-auto">
            <div v-if="!displayBags || displayBags.length === 0" class="text-surface-400 italic p-4">
                No bags to display.
            </div>

            <div v-for="bag in displayBags" :key="bag.id" class="flex flex-col">
                <div class="grid gap-2 p-2 rounded-lg bg-surface-700/30"
                    :style="{ 'grid-template-columns': 'repeat(auto-fill, minmax(60px, 1fr))' }"
                    @dragleave="draggedOverSlot = null">
                    <div v-for="(item, index) in bag.items" :key="index" @dragstart="onDragStart($event, bag.id, index)"
                        @drop.prevent="!isSortOrFilterActive && onDrop($event, bag.id, index)" @dragover.prevent
                        @dragenter.prevent="!isSortOrFilterActive && onDragEnter(bag.id, index)"
                        :class="{ 'outline outline-primary-400 rounded-lg': !isSortOrFilterActive && draggedOverSlot?.bagId === bag.id && draggedOverSlot?.index === index }">
                        <InventoryItemSlot :item="item" @click="openInspector(item)" />
                    </div>
                </div>
            </div>
        </div>

        <ItemInspectorModal />
    </div>
</template>