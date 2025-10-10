<script setup lang="ts">
import InventoryItemSlot from './InventoryItemSlot.vue';
import { usePlayerStore, type UIItem } from '@/stores/player';
import { storeToRefs } from 'pinia';
import ItemInspectorModal from './ItemInspectorModal.vue';
import { ref } from 'vue';

const playerStore = usePlayerStore();
const { bags, totalSlots, usedSlots } = storeToRefs(playerStore);

const draggedOverSlot = ref<{ bagId: number, index: number } | null>(null);

// --- DRAG & DROP LOGIC ---
function onDragStart(event: DragEvent, bagId: number, slotIndex: number) {
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
const openInspector = (item: UIItem | null) => { /* ... unchanged ... */ };
</script>

<template>
    <div class="h-full flex flex-col">
        <h2 class="text-2xl font-bold text-primary-400 mb-4 border-b border-surface-700 pb-2 flex-shrink-0">
            Inventory <span class="text-surface-400 text-lg ml-2">({{ usedSlots }} / {{ totalSlots }} Slots)</span>
        </h2>

        <div class="space-y-8 flex-grow overflow-y-auto">
            <div v-if="!bags || bags.length === 0" class="text-surface-400 italic p-4">
                No bags to display.
            </div>

            <div v-for="bag in bags" :key="bag.id" class="flex flex-col">

                <div
                    class="flex items-center gap-4 bg-surface-700 p-3 rounded-lg shadow-md border-b-2 border-primary-500/50 mb-4">
                    <div
                        class="w-14 h-14 bg-surface-600 rounded-md flex items-center justify-center border border-primary-400 flex-shrink-0">
                        <i :class="getBagIcon(bag.name)" class="text-2xl text-primary-400"></i>
                    </div>

                    <div class="flex-grow">
                        <h3 class="text-xl font-bold text-surface-0">
                            {{ bag.name }}
                            <span class="text-surface-400 text-sm font-normal">({{bag.items.filter(item => item !==
                                null).length}} / {{ bag.slots }} slots)</span>
                        </h3>
                        <p class="text-surface-400 text-sm italic">Status: Equipped (Upgradeable)</p>
                    </div>
                </div>
                <div class="grid gap-2 p-2 rounded-lg bg-surface-700/30"
                    :style="{ 'grid-template-columns': 'repeat(auto-fill, minmax(60px, 1fr))' }"
                    @dragleave="draggedOverSlot = null">
                    <div v-for="(item, index) in bag.items" :key="index" @dragstart="onDragStart($event, bag.id, index)"
                        @drop.prevent="onDrop($event, bag.id, index)" @dragover.prevent
                        @dragenter.prevent="onDragEnter(bag.id, index)"
                        :class="{ 'outline outline-primary-400 rounded-lg': draggedOverSlot?.bagId === bag.id && draggedOverSlot?.index === index }">
                        <InventoryItemSlot :item="item" @click="openInspector(item)" />
                    </div>
                </div>
            </div>
        </div>

        <ItemInspectorModal />
    </div>
</template>