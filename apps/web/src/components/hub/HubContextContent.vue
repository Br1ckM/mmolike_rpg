// src/components/hub/HubContextContent.vue (Updated)

<script setup lang="ts">
import { usePlayerStore } from '@/stores/player';
import { useHubStore } from '@/stores/hub';
import { storeToRefs } from 'pinia';

const playerStore = usePlayerStore();
const hubStore = useHubStore();

const { wallet, equippedItems } = storeToRefs(playerStore);
const { hubName } = storeToRefs(hubStore);
</script>

<template>
    <div>
        <h3 class="text-xl font-semibold mb-3 border-b border-surface-700 pb-2">Player Context</h3>
        <div class="text-surface-300">
            <p><span class="font-bold">Gold:</span> {{ wallet.Gold || 0 }}</p>
            <p><span class="font-bold">Reputation:</span> Neutral</p>
            <p><span class="font-bold">Current Zone:</span> {{ hubName }}</p>

            <h4 class="font-semibold mt-4 text-surface-0">Equipped Gear:</h4>
            <ul v-if="equippedItems.length" class="text-sm pl-4 list-disc list-inside">
                <li v-for="item in equippedItems" :key="item.id">{{ item.name }}</li>
            </ul>
            <p v-else class="text-sm italic text-surface-400 pl-4">Nothing equipped.</p>
        </div>

        <div class="mt-6 border-t border-surface-700 pt-4">
        </div>
    </div>
</template>