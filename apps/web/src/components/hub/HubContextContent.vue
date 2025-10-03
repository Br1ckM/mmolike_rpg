// src/components/hub/HubContextContent.vue (Finalized)

<script setup lang="ts">
import { usePlayerStore } from '@/stores/player';
import { storeToRefs } from 'pinia';
// Removed: import Button from '@/volt/Button.vue';
// Removed: import { useRouter } from 'vue-router';

const playerStore = usePlayerStore();
const { player } = storeToRefs(playerStore);

// Removed: const router = useRouter();
</script>

<template>
    <div>
        <h3 class="text-xl font-semibold mb-3 border-b border-surface-700 pb-2">Player Context</h3>
        <div class="text-surface-300">
            <p><span class="font-bold">Gold:</span> 500</p>
            <p><span class="font-bold">Reputation:</span> Neutral</p>
            <p><span class="font-bold">Current Zone:</span> Whispering Glade</p>
            
            <h4 class="font-semibold mt-4 text-surface-0">Equipped Gear:</h4>
            <ul class="text-sm pl-4 list-disc list-inside">
                <li>Sturdy Longsword</li>
                <li>Traveler's Tunic</li>
                <li>Leather Boots</li>
            </ul>
        </div>
        
        <div class="mt-6 border-t border-surface-700 pt-4">
            </div>
    </div>
</template>