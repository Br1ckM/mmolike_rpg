// src/components/character/CharacterSkillsList.vue (Modified)

<script setup lang="ts">
// Removed: import Card from '@/volt/Card.vue'; // No longer needed for this component

import { ref } from 'vue';

// --- MOCK DATA FOR THE SKILLS PANEL ---
const mockSkills = ref({
    active: [
        { name: 'Shield Bash', rank: 5, type: 'Active', icon: 'pi pi-shield' },
        { name: 'Cleave', rank: 4, type: 'Active', icon: 'pi pi-replay' },
        { name: 'Taunt', rank: 6, type: 'Active', icon: 'pi pi-volume-up' },
        { name: 'Protective Stance', rank: 3, type: 'Active', icon: 'pi pi-lock-open' },
    ],
    passive: [
        { name: 'Vigor', rank: 7, type: 'Passive', icon: 'pi pi-bolt-fill' },
        { name: 'Heavy Armor Training', rank: 8, type: 'Passive', icon: 'pi pi-box' },
    ]
});
</script>

<template>
    <div class="bg-surface-800 rounded-lg shadow-lg p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <div>
                <h3 class="text-xl font-semibold text-surface-0 mb-4 border-b border-surface-700 pb-2">Active Skills</h3>
                <div class="space-y-3">
                    <div v-for="skill in mockSkills.active" :key="skill.name" class="bg-surface-700 shadow-md p-3 rounded-lg">
                        <div class="flex justify-between items-center">
                            <div class="flex items-center gap-3">
                                <i :class="skill.icon" class="text-2xl text-green-400"></i>
                                <span class="text-surface-0 font-bold">{{ skill.name }}</span>
                            </div>
                            <span class="text-sm text-surface-400">Lvl {{ skill.rank }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <h3 class="text-xl font-semibold text-surface-0 mb-4 border-b border-surface-700 pb-2">Passive Skills</h3>
                <div class="space-y-3">
                    <div v-for="skill in mockSkills.passive" :key="skill.name" class="bg-surface-700 shadow-md p-3 rounded-lg">
                        <div class="flex justify-between items-center">
                            <div class="flex items-center gap-3">
                                <i :class="skill.icon" class="text-2xl text-sky-400"></i>
                                <span class="text-surface-0 font-bold">{{ skill.name }}</span>
                            </div>
                            <span class="text-sm text-surface-400">Lvl {{ skill.rank }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>