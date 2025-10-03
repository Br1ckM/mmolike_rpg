<script setup lang="ts">
import Button from '@/volt/Button.vue';
import { useHubStore } from '@/stores/hub';

const hubStore = useHubStore();
</script>

<template>
    <div class="space-y-4 h-full flex flex-col">
        <h3 class="text-xl font-semibold text-surface-0">Guard Captain Liam's Training (Skills)</h3>
        <p class="text-surface-400">This is the placeholder for the Trainer interface. You would list available skills or upgrades here.</p>
        
        <ul class="list-disc list-inside space-y-2 text-surface-300 flex-grow">
            <li>Basic Sword Training (Cost: 50 Gold)</li>
            <li>Defense Stance Upgrade (Cost: 150 Gold)</li>
            <li>Stamina Boost (Requires Level 5)</li>
        </ul>
        
        <div class="border-t border-surface-700 pt-4 flex justify-end flex-shrink-0">
            <Button label="Return to Hub" severity="secondary" @click="hubStore.clearActiveService()" />
        </div>
    </div>
</template>