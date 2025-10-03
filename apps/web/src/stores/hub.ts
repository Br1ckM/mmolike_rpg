// src/stores/hub.ts

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

// Define the interface for the entities we select in the hub list
export interface HubEntity {
    id: number;
    imageUrl: string;
    name: string;
    type: 'NPC' | 'Shop' | 'Trainer';
    // Add other properties as needed
}

export const useHubStore = defineStore('hub', () => {
    // --- State ---
    // Tracks the currently selected entity from the HubNPCList.
    const activeEntity = ref<HubEntity | null>(null);

    // Tracks which specific service panel should be visible in the InteractionPanel.
    const activeService = ref<'Dialogue' | 'Shop' | 'Trainer' | null>(null);

    // --- Actions ---
    function setActiveEntity(entity: HubEntity) {
        activeEntity.value = entity;
        activeService.value = null; // Clear service when entity changes
    }

    function setActiveService(service: 'Dialogue' | 'Shop' | 'Trainer') {
        activeService.value = service;
    }

    function clearActiveService() {
        activeService.value = null;
    }

    return {
        activeEntity,
        activeService,
        setActiveEntity,
        setActiveService,
        clearActiveService,
    };
});