<script setup lang="ts">
import { usePlayerStore } from '@/stores/player';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

const playerStore = usePlayerStore();
const { player } = storeToRefs(playerStore);

// A computed property to safely access the hydrated ancestry data
const ancestry = computed(() => player.value?.ancestry);

const statModifiers = computed(() => {
    if (!ancestry.value?.statModifiers) return [];
    const modifiers = ancestry.value.statModifiers as Record<string, number | unknown>;
    return Object.entries(modifiers)
        .filter(([, value]) => typeof value === 'number' && value > 0)
        .map(([key, value]) => `${key.charAt(0).toUpperCase() + key.slice(1)}: +${value}`);
});
</script>

<template>
    <div v-if="ancestry" class="bg-surface-800 rounded-lg shadow-lg p-6 mb-8">
        <h3 class="text-xl font-semibold text-surface-0 mb-4 border-b border-surface-700 pb-2">Ancestry: {{
            ancestry.name }}</h3>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="md:col-span-2">
                <p class="text-surface-300 italic">{{ ancestry.description }}</p>
            </div>

            <div>
                <h4 class="font-semibold text-surface-200 mb-2">Stat Bonuses</h4>
                <ul v-if="statModifiers.length" class="space-y-1 text-sm">
                    <li v-for="mod in statModifiers" :key="mod" class="flex items-center gap-2">
                        <i class="pi pi-arrow-right text-primary-400 text-xs"></i>
                        <span class="text-surface-200">{{ mod }}</span>
                    </li>
                </ul>
                <p v-else class="text-sm italic text-surface-400">No stat bonuses.</p>
            </div>
        </div>
    </div>
</template>