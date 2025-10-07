<script setup lang="ts">
import Button from '@/volt/Button.vue';
import { computed } from 'vue';

const props = defineProps<{
    result: { winningTeamId: string };
}>();

const emit = defineEmits(['close']);

const isVictory = computed(() => props.result.winningTeamId === 'team1');
</script>

<template>
    <div class="absolute inset-0 bg-black/70 z-30 flex flex-col items-center justify-center text-center p-8">
        <div v-if="isVictory">
            <h2 class="text-6xl font-black text-yellow-400 drop-shadow-lg">VICTORY</h2>
            <p class="text-surface-300 mt-4">You have defeated all enemies.</p>
            <div class="mt-6 bg-surface-800 p-4 rounded-lg">
                <h3 class="font-bold text-lg text-surface-0">Rewards</h3>
                <p class="text-yellow-400 font-mono">+150 XP</p>
                <p class="text-yellow-400 font-mono">+25 Gold</p>
            </div>
        </div>
        <div v-else>
            <h2 class="text-6xl font-black text-red-500 drop-shadow-lg">DEFEAT</h2>
            <p class="text-surface-300 mt-4">Your party has been wiped out.</p>
        </div>

        <Button label="Continue" @click="emit('close')" class="mt-8" />
    </div>
</template>