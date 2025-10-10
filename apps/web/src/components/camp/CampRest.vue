<script setup lang="ts">
import { computed } from 'vue';
import { App } from 'mmolike_rpg-application';
import { usePlayerStore } from '@/stores/player';
import { usePartyStore } from '@/stores/party';
import { storeToRefs } from 'pinia';
import Button from '@/volt/Button.vue';
import Avatar from '@/volt/Avatar.vue';

const playerStore = usePlayerStore();
const partyStore = usePartyStore();

const { player, healthValues, manaValues } = storeToRefs(playerStore);
const { companions } = storeToRefs(partyStore);

// Combine player and active companions into one list for rendering
const partyMembers = computed(() => {
    if (!player.value) return [];

    // Create a player object that matches the companion structure for easy rendering
    const playerMember = {
        id: player.value.id,
        name: player.value.name,
        avatarUrl: 'https://placehold.co/150x150/27272a/eab308?text=A', // Placeholder avatar
        // Use player-specific health/mana from the player store
        health: healthValues.value,
        mana: manaValues.value,
        healthPercentage: playerStore.healthPercentage,
        manaPercentage: playerStore.manaPercentage
    };

    const companionMembers = companions.value
        .filter(c => c.inActiveParty)
        .map(c => ({
            ...c,
            // Companions don't have detailed stats in the store yet, so we use placeholders
            health: { display: '100 / 100' },
            mana: { display: '50 / 50' },
            healthPercentage: 100,
            manaPercentage: 100
        }));

    return [playerMember, ...companionMembers];
});


const performRest = () => {
    if (player.value?.id) {
        App.commands.restAtCamp(player.value.id);
    }
};
</script>

<template>
    <div class="p-4 md:p-6 flex flex-col items-center justify-center h-full text-center">

        <i class="pi pi-sun text-6xl text-amber-400 mb-4"></i>

        <h2 class="text-3xl font-bold text-surface-0 mb-2">Rest & Recover</h2>

        <p class="text-surface-400 mb-6 max-w-md">
            Take a moment to rest at the camp. This will fully restore your party's health and mana, but will advance
            the time of day.
        </p>

        <div class="w-full max-w-lg space-y-4 mb-8">
            <div v-for="member in partyMembers" :key="member.id"
                class="bg-surface-700/50 p-3 rounded-lg flex items-center gap-4">
                <Avatar :image="member.avatarUrl" shape="circle" size="large" />
                <div class="flex-grow text-left">
                    <p class="font-bold text-surface-100">{{ member.name }}</p>
                    <div class="flex items-center justify-between text-xs text-surface-400 mb-0.5">
                        <span>HP</span>
                        <span>{{ member.health.display }}</span>
                    </div>
                    <div class="bg-black/20 rounded-full h-2.5 overflow-hidden border border-surface-900">
                        <div class="h-full bg-green-500 transition-all duration-300"
                            :style="{ width: `${member.healthPercentage}%` }"></div>
                    </div>
                    <div class="flex items-center justify-between text-xs text-surface-400 mt-1 mb-0.5">
                        <span>MP</span>
                        <span>{{ member.mana.display }}</span>
                    </div>
                    <div class="bg-black/20 rounded-full h-2.5 overflow-hidden border border-surface-900">
                        <div class="h-full bg-sky-500 transition-all duration-300"
                            :style="{ width: `${member.manaPercentage}%` }"></div>
                    </div>
                </div>
            </div>
        </div>

        <Button label="Rest & Advance Time" icon="pi pi-check-circle" @click="performRest" :disabled="!player"
            class="!text-lg !py-3 !px-6" />
    </div>
</template>