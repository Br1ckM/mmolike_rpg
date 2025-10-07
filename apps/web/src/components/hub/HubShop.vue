<script setup lang="ts">
import Button from '@/volt/Button.vue';
import { useGameStore } from '@/stores/game';
import { storeToRefs } from 'pinia';

const gameStore = useGameStore();
const { vendorItems } = storeToRefs(gameStore);

// Placeholder function for buying an item
const buyItem = (itemId: number) => {
    console.log(`Attempting to buy item ${itemId}`);
    // In a real implementation, you would call:
    // App.commands.buyItem(player.value.id, npc.value.id, itemId);
}
</script>

<template>
    <div class="space-y-4 h-full flex flex-col">
        <h3 class="text-xl font-semibold text-surface-0">Grizzle's Inventory (Buy)</h3>

        <div v-if="vendorItems.length"
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-grow overflow-y-auto p-2">
            <div v-for="item in vendorItems" :key="item.id"
                class="bg-surface-700 p-3 rounded-md flex flex-col items-center text-center hover:bg-surface-600 cursor-pointer"
                @click="buyItem(item.id)">
                <i :class="item.icon" class="text-4xl text-primary-400 mb-2"></i>
                <p class="font-semibold text-surface-100">{{ item.name }}</p>
                <p class="text-sm text-yellow-400 font-mono">{{ item.cost }} Gold</p>
            </div>
        </div>
        <p v-else class="text-surface-400 italic flex-grow">The shelves are bare.</p>

        <div class="border-t border-surface-700 pt-4 flex justify-end flex-shrink-0">
            <Button label="Done Shopping" severity="secondary" @click="gameStore.clearActiveService()" />
        </div>
    </div>
</template>