<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings';
import { usePlayerStore } from '@/stores/player';
import { storeToRefs } from 'pinia';
import { onMounted, computed, ref } from 'vue';
import SelectButton from '@/volt/SelectButton.vue'; // <-- NEW IMPORT

const settingsStore = useSettingsStore();
const {
    isNsfwBuild,
    showNsfwContent,
    showVoreContent,
    isVoreToggleVisible,
} = storeToRefs(settingsStore);

const playerStore = usePlayerStore();
const { player, playerVoreRole } = storeToRefs(playerStore);

onMounted(() => {
    settingsStore.initialize();
    playerStore.initialize();
});

const voreRoleOptions = ref(['Neither', 'Prey', 'Predator', 'Both']);

// Create a computed property with a getter and setter for two-way binding
const selectedVoreRole = computed({
    get: () => playerVoreRole.value,
    set: (newRole) => {
        if (!player.value) return;
        settingsStore.setPlayerVoreRole(player.value.id, newRole as any);
    }
});
</script>

<template>
    <div class="p-4 md:p-8 text-surface-0">
        <h1 class="text-3xl font-bold mb-6 border-b border-surface-700 pb-2">Settings</h1>

        <div v-if="isNsfwBuild" class="space-y-6">
            <div class="bg-surface-800 p-4 rounded-lg shadow-lg">
                <h2 class="text-xl font-semibold mb-3">Content Filters</h2>

                <!-- Adult Content Toggle -->
                <div class="flex items-center justify-between">
                    <label for="nsfw-toggle" class="font-medium">Show Adult Content</label>
                    <button @click="settingsStore.toggleNsfwContent()" :class="[
                        'relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
                        showNsfwContent ? 'bg-primary-600' : 'bg-surface-600'
                    ]">
                        <span aria-hidden="true" :class="[
                            'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200',
                            showNsfwContent ? 'translate-x-5' : 'translate-x-0'
                        ]"></span>
                    </button>
                </div>

                <!-- Vore Content Toggle (conditional) -->
                <div v-if="isVoreToggleVisible"
                    class="flex items-center justify-between mt-4 pt-4 border-t border-surface-700">
                    <label for="vore-toggle" class="font-medium">Show Vore Content</label>
                    <button @click="settingsStore.toggleVoreContent()" :class="[
                        'relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
                        showVoreContent ? 'bg-primary-600' : 'bg-surface-600'
                    ]">
                        <span aria-hidden="true" :class="[
                            'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200',
                            showVoreContent ? 'translate-x-5' : 'translate-x-0'
                        ]"></span>
                    </button>
                </div>
            </div>

            <!-- Vore Role Selector (conditional) -->
            <div v-if="showVoreContent" class="bg-surface-800 p-4 rounded-lg shadow-lg">
                <h2 class="text-xl font-semibold mb-3">Vore Settings</h2>
                <div class="flex items-center justify-between">
                    <label for="vore-role" class="font-medium">Player Vore Role</label>
                    <SelectButton v-model="selectedVoreRole" :options="voreRoleOptions" aria-labelledby="vore-role" />
                </div>
            </div>

        </div>

        <div v-else>
            <p class="text-surface-400 italic">No configurable settings for this build.</p>
        </div>
    </div>
</template>
