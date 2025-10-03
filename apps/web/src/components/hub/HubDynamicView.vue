// src/components/hub/HubDynamicView.vue (NEW)

<script setup lang="ts">
import HubNPCList from './HubNPCList.vue'; // Default view
import HubShop from './HubShop.vue'; // New service view
import HubTrainer from './HubTrainer.vue'; // New service view

import { useHubStore } from '@/stores/hub';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

const hubStore = useHubStore();
const { activeService, activeEntity } = storeToRefs(hubStore);

// Title will change based on what service is active
const currentTitle = computed(() => {
    if (activeService.value) {
        return `${activeEntity.value?.name}: ${activeService.value} Services`;
    }
    return 'Current Location: Town of Everwood';
});

// Action to allow the user to easily exit a service screen back to the NPC list
const exitService = () => {
    hubStore.clearActiveService();
};
</script>

<template>
    <div class="h-full flex flex-col">
        
        <div class="flex justify-between items-center mb-4 border-b border-surface-700 pb-2 flex-shrink-0">
            <h2 class="text-2xl font-bold text-primary-400">{{ currentTitle }}</h2>
            
            <button v-if="activeService" @click="exitService" class="text-sm text-surface-400 hover:text-surface-0 transition-colors duration-200">
                &larr; Back to Town
            </button>
        </div>
        
        <div class="flex-grow overflow-y-auto">

            <HubShop v-if="activeService === 'Shop'" />

            <HubTrainer v-else-if="activeService === 'Trainer'" />

            <HubNPCList v-else />

        </div>

    </div>
</template>