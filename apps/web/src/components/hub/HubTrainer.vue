<script setup lang="ts">
import Button from '@/volt/Button.vue';
import { useGameStore } from '@/stores/game';
import { storeToRefs } from 'pinia';

const gameStore = useGameStore();
const { trainerSkills } = storeToRefs(gameStore);

// Placeholder function for learning a skill
const learnSkill = (skillId: string) => {
    console.log(`Attempting to learn skill ${skillId}`);
    // In a real implementation, you would call:
    // App.commands.learnSkill(player.value.id, npc.value.id, skillId);
}
</script>

<template>
    <div class="space-y-4 h-full flex flex-col">
        <h3 class="text-xl font-semibold text-surface-0">Guard Captain Liam's Training (Skills)</h3>

        <div v-if="trainerSkills.length" class="space-y-3 flex-grow overflow-y-auto pr-2">
            <div v-for="skill in trainerSkills" :key="skill.id"
                class="bg-surface-700 p-3 rounded-lg hover:bg-surface-600 cursor-pointer flex justify-between items-center"
                @click="learnSkill(skill.id)">
                <div>
                    <p class="font-bold text-surface-0">{{ skill.name }}</p>
                    <p class="text-xs text-surface-400 italic">{{ skill.description }}</p>
                </div>
                <div class="text-right ml-4">
                    <p class="font-mono text-yellow-400">{{ skill.cost }} Gold</p>
                    <Button label="Learn" size="small" class="mt-1" />
                </div>
            </div>
        </div>
        <p v-else class="text-surface-400 italic flex-grow">There is nothing more to learn right now.</p>

        <div class="border-t border-surface-700 pt-4 flex justify-end flex-shrink-0">
            <Button label="Return to Hub" severity="secondary" @click="gameStore.clearActiveService()" />
        </div>
    </div>
</template>