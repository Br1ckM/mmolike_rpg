<script setup lang="ts">
import InventoryItemSlot from './InventoryItemSlot.vue';
// --- FIX: Import the correct type name 'UIItem' ---
import { usePlayerStore, type UIItem } from '@/stores/player';
import { storeToRefs } from 'pinia';
import ItemInspectorModal from './ItemInspectorModal.vue';

const playerStore = usePlayerStore();
const { bags, totalSlots, usedSlots } = storeToRefs(playerStore);

// Helper to determine the icon for the Bag Item Card
const getBagIcon = (bagName: string) => {
    if (bagName.includes('Primary')) return 'pi pi-shopping-bag';
    if (bagName.includes('Secondary')) return 'pi pi-folder-open';
    if (bagName.includes('Pouch')) return 'pi pi-briefcase';
    return 'pi pi-box';
}

const openInspector = (item: UIItem | null) => {
    if (item) {
        playerStore.inspectItem(item);
    }
}
</script>

<template>
    <div class="h-full flex flex-col">

        <h2 class="text-2xl font-bold text-primary-400 mb-4 border-b border-surface-700 pb-2 flex-shrink-0">
            Inventory <span class="text-surface-400 text-lg ml-2">({{ usedSlots }} / {{ totalSlots }} Slots)</span>
        </h2>

        <div class="space-y-8 flex-grow overflow-y-auto">

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
                    :style="{ 'grid-template-columns': 'repeat(auto-fill, minmax(60px, 1fr))' }">

                    <InventoryItemSlot v-for="(item, index) in bag.items" :key="index" :item="item"
                        @click="(console.log('Open Inspector Modal for:', item?.name), openInspector(item))" />
                </div>
            </div>
        </div>

        <ItemInspectorModal />
    </div>
</template>