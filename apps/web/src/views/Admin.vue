<script setup lang="ts">
import { ref } from 'vue';
import { usePlayerStore } from '@/stores/player';
import { storeToRefs } from 'pinia';
import { App } from 'mmolike_rpg-application';
import Button from '@/volt/Button.vue';

const playerStore = usePlayerStore();
const { player } = storeToRefs(playerStore);

const preyName = ref('Test Goblin');
const digestionTime = ref(10);
const strugglePower = ref(5);

const addPrey = () => {
    if (player.value) {
        App.commands.dev_addPreyToStomach(player.value.id, {
            name: preyName.value,
            digestionTime: digestionTime.value,
            strugglePower: strugglePower.value,
            size: 1, // Default size for now
            nutritionValue: 25, // Default nutrition
        });
    }
};
</script>

<template>
    <div class="p-4 md:p-8 text-surface-0">
        <h1 class="text-3xl font-bold mb-6 border-b border-surface-700 pb-2">Admin Panel (Dev Only)</h1>

        <div class="space-y-8">
            <!-- Vore System Debugging -->
            <div class="bg-surface-800 p-4 rounded-lg shadow-lg">
                <h2 class="text-xl font-semibold mb-4">Vore System</h2>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label for="prey-name" class="block text-sm font-medium text-surface-300">Prey Name</label>
                        <input type="text" id="prey-name" v-model="preyName"
                            class="mt-1 block w-full bg-surface-700 border-surface-600 rounded-md shadow-sm text-white p-2" />
                    </div>
                    <div>
                        <label for="digestion-time" class="block text-sm font-medium text-surface-300">Digestion
                            Turns</label>
                        <input type="number" id="digestion-time" v-model.number="digestionTime"
                            class="mt-1 block w-full bg-surface-700 border-surface-600 rounded-md shadow-sm text-white p-2" />
                    </div>
                    <div>
                        <label for="struggle-power" class="block text-sm font-medium text-surface-300">Struggle
                            Power</label>
                        <input type="number" id="struggle-power" v-model.number="strugglePower"
                            class="mt-1 block w-full bg-surface-700 border-surface-600 rounded-md shadow-sm text-white p-2" />
                    </div>
                </div>
                <div class="mt-4">
                    <Button @click="addPrey">Add Test Prey to Stomach</Button>
                </div>
            </div>

            <!-- Other Admin Sections can go here -->

        </div>
    </div>
</template>
