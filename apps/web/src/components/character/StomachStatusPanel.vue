<script setup lang="ts">
import { usePlayerStore } from '@/stores/player';
import { storeToRefs } from 'pinia';

const playerStore = usePlayerStore();
const { stomachContents } = storeToRefs(playerStore);
</script>

<template>
    <div class="bg-surface-800 rounded-lg shadow-lg p-6 mb-8">
        <h3 class="text-xl font-semibold text-surface-0 mb-4 border-b border-surface-700 pb-2">Stomach Contents</h3>

        <div v-if="stomachContents.length > 0" class="space-y-3">
            <div v-for="(prey, index) in stomachContents" :key="index"
                class="bg-surface-700 p-3 rounded-lg flex justify-between items-center">

                <div class="flex items-center gap-3">
                    <i class="pi pi-user text-lg text-primary-400"></i>
                    <div>
                        <p class="font-bold text-surface-0">{{ prey.name }}</p>
                        <p class="text-xs text-surface-400 italic">Location: {{ prey.voreType }}</p>
                    </div>
                </div>

                <div class="text-right">
                    <p class="font-mono text-amber-400">{{ prey.digestionTimer }} turns</p>
                    <p class="text-xs text-surface-500">remaining</p>
                </div>
            </div>
        </div>
        <div v-else>
            <p class="text-surface-400 italic">All stomachs are empty.</p>
        </div>
    </div>
</template>
