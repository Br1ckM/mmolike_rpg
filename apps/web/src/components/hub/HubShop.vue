<script setup lang="ts">
import Button from '@/volt/Button.vue';
import { useHubStore } from '@/stores/hub';

const hubStore = useHubStore();
</script>

<template>
    <div class="space-y-4 h-full flex flex-col">
        <h3 class="text-xl font-semibold text-surface-0">Grizzle's Inventory (Buy)</h3>
        <p class="text-surface-400">This is the placeholder for the Shop interface. You would display item cards here for buying and selling.</p>
        
        <div class="grid grid-cols-3 gap-4 flex-grow">
            <div class="bg-surface-700 p-3 rounded-md">Item A - 10 Gold</div>
            <div class="bg-surface-700 p-3 rounded-md">Item B - 25 Gold</div>
            <div class="bg-surface-700 p-3 rounded-md">Item C - 5 Gold</div>
        </div>

        <div class="border-t border-surface-700 pt-4 flex justify-end flex-shrink-0">
            <Button label="Done Shopping" severity="secondary" @click="hubStore.clearActiveService()" />
        </div>
    </div>
</template>