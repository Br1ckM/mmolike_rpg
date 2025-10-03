// src/views/Inventory.vue

<script setup lang="ts">
import InventoryWallet from '@/components/inventory/InventoryWallet.vue';
import InventoryBelt from '@/components/inventory/InventoryBelt.vue';
import InventoryBags from '@/components/inventory/InventoryBags.vue';
// NO LONGER NEEDED: import { usePlayerStore } from '@/stores/inventory';
import { onMounted } from 'vue';

// Initialize the store
const playerStore = usePlayerStore();

onMounted(() => {
    // You'd typically load data here
});
</script>

<template>
    <div class="p-4 md:p-8 flex gap-4 md:gap-8 h-full">
        
        <div class="w-full md:w-3/4 flex flex-col gap-4 md:gap-8">
            <div class="bg-surface-800 rounded-lg shadow-lg p-4 md:p-6 flex-grow min-h-0">
                <InventoryBags />
            </div>
        </div>

        <div class="w-full md:w-1/4 flex flex-col gap-4 md:gap-8">
            <div class="bg-surface-800 rounded-lg shadow-lg p-4">
                <InventoryWallet />
            </div>
            <div class="bg-surface-800 rounded-lg shadow-lg p-4 flex-grow min-h-0">
                <InventoryBelt />
            </div>
        </div>
        
    </div>
</template>