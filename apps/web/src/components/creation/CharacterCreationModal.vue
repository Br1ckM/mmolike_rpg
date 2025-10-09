<script setup lang="ts">
import Dialog from '@/volt/Dialog.vue';
import Button from '@/volt/Button.vue';
import { ref, onMounted, computed } from 'vue';
import { useUIStore } from '@/stores/ui';
import { usePlayerStore } from '@/stores/player';
import { useGameStore } from '@/stores/game';
import { useHubStore } from '@/stores/hub';
import { usePartyStore } from '@/stores/party'
import { App } from 'mmolike_rpg-application';

interface Ancestry {
    id: string;
    name: string;
    description: string;
    statModifiers: {
        strength: number;
        dexterity: number;
        intelligence: number;
    };
}

const uiStore = useUIStore();
const name = ref('');
const pronouns = ref('he/him');
const ancestryId = ref('ancestry_human');

const ancestryOptions = ref<Ancestry[]>([]);
const pronounOptions = ['he/him', 'she/her', 'they/them'];

onMounted(async () => {
    await App.isReady;
    ancestryOptions.value = App.directQueries.getStaticContent('ancestries');
});

const selectedAncestry = computed(() => {
    return ancestryOptions.value.find(a => a.id === ancestryId.value);
});

const createCharacter = () => {
    if (!name.value.trim()) {
        alert('Please enter a name.');
        return;
    }
    App.commands.createCharacter({
        name: name.value,
        pronouns: pronouns.value,
        ancestryId: ancestryId.value,
    });
    uiStore.hideCharacterCreation();
    usePlayerStore().initialize();
    useGameStore().initialize();
    useHubStore().initialize();
    usePartyStore().initialize();
};
</script>

<template>
    <Dialog :visible="uiStore.showCharacterCreation" :modal="true" :closable="false" header="Create Your Character"
        class="w-11/12 md:w-2/3 lg:max-w-4xl">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="space-y-4">
                <div>
                    <label for="name" class="block text-sm font-medium text-surface-200">Name</label>
                    <input type="text" id="name" v-model="name"
                        class="mt-1 block w-full bg-surface-700 border-surface-600 rounded-md shadow-sm text-white p-2" />
                </div>
                <div>
                    <label for="ancestry" class="block text-sm font-medium text-surface-200">Ancestry</label>
                    <select id="ancestry" v-model="ancestryId"
                        class="mt-1 block w-full bg-surface-700 border-surface-600 rounded-md shadow-sm text-white p-2">
                        <option v-for="opt in ancestryOptions" :key="opt.id" :value="opt.id">{{ opt.name }}</option>
                    </select>
                </div>
                <div>
                    <label for="pronouns" class="block text-sm font-medium text-surface-200">Pronouns</label>
                    <select id="pronouns" v-model="pronouns"
                        class="mt-1 block w-full bg-surface-700 border-surface-600 rounded-md shadow-sm text-white p-2">
                        <option v-for="opt in pronounOptions" :key="opt" :value="opt">{{ opt }}</option>
                    </select>
                </div>
            </div>

            <div v-if="selectedAncestry" class="bg-surface-800 p-4 rounded-lg">
                <h3 class="text-xl font-bold text-primary-400 mb-2">{{ selectedAncestry.name }}</h3>
                <p class="text-sm text-surface-300 italic mb-4">{{ selectedAncestry.description }}</p>

                <h4 class="font-semibold text-surface-100 mb-2">Stat Bonuses</h4>
                <ul class="text-sm space-y-1">
                    <li v-if="selectedAncestry.statModifiers.strength > 0">
                        +{{ selectedAncestry.statModifiers.strength }} Strength
                    </li>
                    <li v-if="selectedAncestry.statModifiers.dexterity > 0">
                        +{{ selectedAncestry.statModifiers.dexterity }} Dexterity
                    </li>
                    <li v-if="selectedAncestry.statModifiers.intelligence > 0">
                        +{{ selectedAncestry.statModifiers.intelligence }} Intelligence
                    </li>
                </ul>
            </div>
        </div>
        <template #footer>
            <Button label="Create Character" @click="createCharacter" />
        </template>
    </Dialog>
</template>