// src/views/Hub.vue

<script setup lang="ts">
import HubDynamicView from '@/components/hub/HubDynamicView.vue';
import DialogueOverlay from '@/components/hub/DialogueOverlay.vue';
import HubContextContent from '@/components/hub/HubContextContent.vue';
import { onMounted } from 'vue';
import { useHubStore } from '@/stores/hub'; // <-- IMPORT

// Initialize the store when the component mounts
const hubStore = useHubStore();
onMounted(() => {
    hubStore.initialize();
})
</script>

<template>
    <div class="p-4 md:p-8 flex gap-4 md:gap-8 h-full">
        
        <div class="w-full md:w-3/4 flex flex-col gap-4 md:gap-8">
            <div class="bg-surface-800 rounded-lg shadow-lg p-4 md:p-6 flex-grow">
                <HubDynamicView />
            </div>
        </div>

        <div class="w-full md:w-1/4 flex flex-col gap-4 md:gap-8">
            <div class="bg-surface-800 rounded-lg shadow-lg p-4 flex-grow min-h-0">
                <HubContextContent />
            </div>
        </div>

        <DialogueOverlay />
        
    </div>
</template>