<script setup lang="ts">
import { useGameStore } from '@/stores/game';
import { storeToRefs } from 'pinia';
import Button from '@/volt/Button.vue'; // <-- 1. Import the Button component

const gameStore = useGameStore();
const { denState } = storeToRefs(gameStore);
</script>

<template>
    <Teleport to="body">
        <div v-if="denState && denState.status === 'COMPLETED'"
            class="absolute inset-0 bg-black/70 flex items-center justify-center text-center" style="z-index: 99;">
            <div>
                <h2 class="text-6xl font-black text-yellow-400 drop-shadow-lg">DEN CLEARED</h2>
                <p class="text-surface-300 mt-4">You have defeated all enemies within the den.</p>
                <Button label="Continue" @click="gameStore.clearDenState()" class="mt-8" />
            </div>
        </div>

        <div v-if="denState && denState.status === 'FAILED'"
            class="absolute inset-0 bg-black/70 flex items-center justify-center text-center" style="z-index: 99;">
            <div>
                <h2 class="text-6xl font-black text-red-500 drop-shadow-lg">DEN FAILED</h2>
                <p class="text-surface-300 mt-4">Your party was defeated.</p>
                <Button label="Continue" @click="gameStore.clearDenState()" class="mt-8" />
            </div>
        </div>
    </Teleport>
</template>