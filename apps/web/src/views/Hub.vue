// src/views/Hub.vue (Modified)

<script setup lang="ts">
import HubNPCList from '@/components/hub/HubNPCList.vue'; // Will be used inside HubDynamicView
import HubContextContent from '@/components/hub/HubContextContent.vue'; // Renamed right-column content
import HubDynamicView from '@/components/hub/HubDynamicView.vue'; // NEW Dynamic Wrapper
import DialogueOverlay from '@/components/hub/DialogueOverlay.vue';
import { onMounted } from 'vue';

// NOTE: You'll want to initialize a hub-specific store here later
onMounted(() => {
    // Example: hubStore.loadLocalNPCs();
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