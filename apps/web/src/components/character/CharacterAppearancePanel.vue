<script setup lang="ts">
import { usePlayerStore } from '@/stores/player';
import { storeToRefs } from 'pinia';

const playerStore = usePlayerStore();
// FIX: Destructure the pre-formatted 'appearanceAttributes' getter directly from the store.
const { appearanceAttributes } = storeToRefs(playerStore);
</script>

<template>
    <div class="bg-surface-800 rounded-lg shadow-lg p-6 mb-8">
        <h3 class="text-xl font-semibold text-surface-0 mb-4 border-b border-surface-700 pb-2">Physical Appearance</h3>
        <div v-if="appearanceAttributes.length > 0" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <!-- The template can now correctly access 'label' and 'unit' from the formatted data -->
            <div v-for="attr in appearanceAttributes" :key="attr.label"
                class="bg-surface-700 p-3 rounded-lg text-center">
                <span class="text-sm text-surface-400">{{ attr.label }}</span>
                <p class="font-bold text-xl text-surface-0">{{ attr.value }}{{ attr.unit }}</p>
            </div>
        </div>
        <div v-else>
            <p class="text-surface-400 italic">No appearance attributes to display based on current filters.</p>
        </div>
    </div>
</template>
