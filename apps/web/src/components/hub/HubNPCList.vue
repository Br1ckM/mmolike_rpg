// src/components/hub/HubNPCList.vue

<script setup lang="ts">
import Avatar from '@/volt/Avatar.vue';
import { useHubStore, type HubNpc } from '@/stores/hub';
import { useGameStore } from '@/stores/game';
import { usePlayerStore } from '@/stores/player';
import { storeToRefs } from 'pinia';
import { App } from 'mmolike_rpg-application/core';

const hubStore = useHubStore();
const gameStore = useGameStore();
const playerStore = usePlayerStore();

// Get the reactive list of NPCs from the store
const { npcs } = storeToRefs(hubStore);
const { playerId } = storeToRefs(playerStore);

const selectEntity = (npc: HubNpc) => {
    if (!playerId.value) return;
    // Tell the backend to start a dialogue session
    App.commands.initiateDialogue(playerId.value, npc.id);
};

// Helper to get NPC description (will need to be added to DTO later)
const getDescription = (npcName: string) => {
    if (npcName.includes('Mayor')) return 'The town leader, concerned about local threats.';
    if (npcName.includes('Blacksmith')) return 'Buy and sell weapons and armor.';
    if (npcName.includes('Alchemist')) return 'Provides training in the alchemical arts.';
    return 'A resident of the village.';
}
</script>

<template>
    <div class="h-full flex flex-col">
        <div class="space-y-4 overflow-y-auto flex-grow">
            <div v-for="{ id, InfoComponent } in npcs" :key="id" @click="selectEntity({ id, InfoComponent })"
                class="bg-surface-700 rounded-lg p-3 flex items-center gap-4 hover:bg-surface-600 transition-colors duration-200 cursor-pointer">
                <Avatar :image="InfoComponent.avatarUrl" size="large" shape="square" />

                <div class="flex-grow">
                    <p class="text-lg font-semibold text-surface-0">{{ InfoComponent.name }}</p>
                    <p class="text-sm text-surface-400">{{ getDescription(InfoComponent.name) }}</p>
                </div>
            </div>
            <p v-if="!npcs || npcs.length === 0" class="text-surface-400 italic">No one else is here right now.</p>
        </div>
    </div>
</template>