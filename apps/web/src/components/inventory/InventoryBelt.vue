// src/components/inventory/InventoryBelt.vue (Modified)

<script setup lang="ts">
import { usePlayerStore } from '@/stores/player';
import { storeToRefs } from 'pinia';
import InventoryItemSlot from './InventoryItemSlot.vue';

const playerStore = usePlayerStore();
const { belt } = storeToRefs(playerStore);

const useItem = (index: number) => {
    // Call the action in the player store to use the item.
    playerStore.useConsumable(index);
};
</script>

<template>
    <div>
        <h3 class="text-xl font-semibold mb-3 border-b border-surface-700 pb-2 flex items-center gap-2">
            <i class="pi pi-tag text-primary-400"></i> Consumable Belt (F1 - F5)
        </h3>

        <div class="grid grid-cols-5 gap-2">
            <div v-for="(item, index) in belt" :key="index" @click="useItem(index)" class="relative">
                <InventoryItemSlot :item="item" />

                <span
                    class="absolute top-0 left-0 bg-surface-900/50 text-surface-300 text-[10px] px-1 rounded-br-md z-20">
                    F{{ index + 1 }}
                </span>
            </div>
        </div>
        <p class="text-surface-500 text-xs italic mt-3">Click a consumable to use it.</p>
    </div>
</template>