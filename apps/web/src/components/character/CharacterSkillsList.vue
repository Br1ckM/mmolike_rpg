<script setup lang="ts">
import { usePlayerStore } from '@/stores/player';
import { storeToRefs } from 'pinia';

const playerStore = usePlayerStore();
const { activeSkills, passiveSkills } = storeToRefs(playerStore);
</script>

<template>
    <div class="bg-surface-800 rounded-lg shadow-lg p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">

            <div>
                <h3 class="text-xl font-semibold text-surface-0 mb-4 border-b border-surface-700 pb-2">Active Skills
                </h3>
                <div v-if="activeSkills.length" class="space-y-3">
                    <div v-for="skill in activeSkills" :key="skill.id" class="bg-surface-700 shadow-md p-3 rounded-lg">
                        <div class="flex justify-between items-center">
                            <div class="flex items-center gap-3">
                                <i :class="skill.icon" class="text-2xl text-green-400"></i>
                                <span class="text-surface-0 font-bold">{{ skill.name }}</span>
                            </div>
                            <span class="text-sm text-surface-400">Lvl {{ skill.rank }}</span>
                        </div>
                    </div>
                </div>
                <p v-else class="text-surface-400 italic">No active skills learned.</p>
            </div>

            <div>
                <h3 class="text-xl font-semibold text-surface-0 mb-4 border-b border-surface-700 pb-2">Passive Skills
                </h3>
                <div v-if="passiveSkills.length" class="space-y-3">
                    <div v-for="skill in passiveSkills" :key="skill.id" class="bg-surface-700 shadow-md p-3 rounded-lg">
                        <div class="flex justify-between items-center">
                            <div class="flex items-center gap-3">
                                <i :class="skill.icon" class="text-2xl text-sky-400"></i>
                                <span class="text-surface-0 font-bold">{{ skill.name }}</span>
                            </div>
                            <span class="text-sm text-surface-400">Lvl {{ skill.rank }}</span>
                        </div>
                    </div>
                </div>
                <p v-else class="text-surface-400 italic">No passive skills learned.</p>
            </div>
        </div>
    </div>
</template>