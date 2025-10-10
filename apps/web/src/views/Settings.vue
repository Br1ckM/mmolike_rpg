<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings';
import { usePlayerStore } from '@/stores/player';
import { storeToRefs } from 'pinia';
import { onMounted, computed, ref } from 'vue';
import Button from '@/volt/Button.vue'; // Used for Save Management
import SelectButton from '@/volt/SelectButton.vue'; // Used for Vore Role selector
import { App } from 'mmolike_rpg-application'; // Used for persistence commands

// --- SETTINGS STORE (Content Filters) ---
const settingsStore = useSettingsStore();
const { autoSaveEnabled } = storeToRefs(settingsStore);
const {
    isNsfwBuild,
    showNsfwContent,
    showVoreContent,
    isVoreToggleVisible,
} = storeToRefs(settingsStore);

// --- PLAYER STORE (Vore Role) ---
const playerStore = usePlayerStore();
const { player, playerVoreRole } = storeToRefs(playerStore);

// --- LIFECYCLE & INITIALIZATION ---
onMounted(() => {
    // Ensure both stores are initialized to load settings and player data
    settingsStore.initialize();
    playerStore.initialize();
});

// --- VORE ROLE LOGIC ---
const voreRoleOptions = ref(['Neither', 'Prey', 'Predator', 'Both']);

// Computed property with getter/setter to handle Vore Role updates
const selectedVoreRole = computed({
    get: () => playerVoreRole.value,
    set: (newRole) => {
        if (!player.value) return;
        // The settings store calls the game command to update the role and trigger a refresh
        settingsStore.setPlayerVoreRole(player.value.id, newRole as any);
    }
});

// --- PERSISTENCE LOGIC ---
const saveGame = () => {
    App.commands.saveGame();
};

const loadGame = () => {
    if (confirm('Are you sure you want to load? Any unsaved progress will be lost.')) {
        App.commands.loadGame();
    }
};

const exportSave = () => App.commands.exportSave();

const onImportClick = () => {
    document.getElementById('import-file-input')?.click();
};

const handleFileImport = (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === 'string') {
            if (confirm('Are you sure you want to import this save? This will overwrite your current progress.')) {
                App.commands.importSave(text);
            }
        }
    };
    reader.readAsText(file);
};
</script>

<template>
    <div class="p-4 md:p-8 text-surface-0">
        <h1 class="text-3xl font-bold text-primary-400 mb-6 border-b border-surface-700 pb-2">Settings</h1>

        <div class="space-y-8">

            <!-- 1. ADULT/VORE CONTENT FILTERS -->
            <div v-if="isNsfwBuild" class="space-y-6">

                <!-- Content Filters Card -->
                <div class="bg-surface-800 p-6 rounded-lg shadow-lg">
                    <h2 class="text-xl font-semibold mb-4 text-surface-100 border-b border-surface-700 pb-2">Content
                        Filters</h2>

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
                <div v-if="showVoreContent" class="bg-surface-800 p-6 rounded-lg shadow-lg">
                    <h2 class="text-xl font-semibold mb-4 text-surface-100 border-b border-surface-700 pb-2">Player Role
                    </h2>
                    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <label for="vore-role" class="font-medium">Player Vore Role</label>
                        <SelectButton v-model="selectedVoreRole" :options="voreRoleOptions"
                            aria-labelledby="vore-role" />
                    </div>
                </div>
            </div>

            <div v-else class="bg-surface-800 p-6 rounded-lg shadow-lg">
                <h2 class="text-xl font-semibold mb-4 text-surface-100 border-b border-surface-700 pb-2">General</h2>
                <p class="text-surface-400 italic">No configurable content settings for this build.</p>
            </div>

            <!-- 2. PERSISTENCE SECTION (Save Management) -->
            <div class="bg-surface-800 p-6 rounded-lg shadow-lg">
                <h2 class="text-xl font-semibold text-surface-100 mb-4 border-b border-surface-700 pb-2">Save Management
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button @click="saveGame" label="Save Game" icon="pi pi-save" />
                    <Button @click="loadGame" label="Load Game" icon="pi pi-folder-open"
                        class="!bg-amber-600 hover:!bg-amber-700" />
                    <Button @click="exportSave" label="Export Save to File" icon="pi pi-download"
                        class="!bg-sky-600 hover:!bg-sky-700" />

                    <div>
                        <Button @click="onImportClick" label="Import Save from File" icon="pi pi-upload"
                            class="!bg-green-600 hover:!bg-green-700 w-full" />
                        <input type="file" id="import-file-input" @change="handleFileImport" accept=".json"
                            class="hidden" />
                    </div>
                </div>
            </div>


            <div class="flex items-center justify-between mb-4 pb-4 border-b border-surface-700">
                <label for="auto-save-toggle" class="font-medium">Enable Auto-Save (every 60s)</label>
                <button @click="settingsStore.toggleAutoSave()" :class="[
                    'relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
                    autoSaveEnabled ? 'bg-primary-600' : 'bg-surface-600'
                ]">
                    <span aria-hidden="true" :class="[
                        'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200',
                        autoSaveEnabled ? 'translate-x-5' : 'translate-x-0'
                    ]"></span>
                </button>
            </div>
        </div>
    </div>
</template>