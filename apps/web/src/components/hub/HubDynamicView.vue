// src/components/hub/HubDynamicView.vue

<script setup lang="ts">
import HubNPCList from './HubNPCList.vue';
import HubShop from './HubShop.vue';
import HubTrainer from './HubTrainer.vue';
import Button from '@/volt/Button.vue'; // Import Button for the back button

import { useHubStore } from '@/stores/hub';
import { useGameStore } from '@/stores/game'; // <-- Import gameStore
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

const hubStore = useHubStore();
const gameStore = useGameStore(); // <-- Use gameStore
const { hubName } = storeToRefs(hubStore);
const { activeService } = storeToRefs(gameStore); // <-- Get activeService from gameStore

const currentTitle = computed(() => {
    if (activeService.value) {
        // You can make this more dynamic later if needed
        return `Service: ${activeService.value}`;
    }
    return `Location: ${hubName.value}`;
});

</script>

<template>
    <div class="h-full flex flex-col">
        <div class="flex-grow overflow-y-auto">
            <HubShop v-if="activeService === 'Shop'" />
            <HubTrainer v-else-if="activeService === 'Trainer'" />
            <HubNPCList v-else :key="hubName" />
        </div>
    </div>
</template>