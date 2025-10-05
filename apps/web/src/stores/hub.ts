// src/stores/hub.ts

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { App } from 'mmolike_rpg-application';

// Define types for the data we expect from the backend
interface HubNpc {
    id: number;
    InfoComponent: {
        name: string;
        avatarUrl: string;
    };
}

interface HubState {
    location: {
        id: number;
        LocationComponent: {
            name: string;
            description: string;
        }
    } | null;
    npcs: HubNpc[];
    nodes: HubNode[];
}

interface HubNode {
    id: number;
    NodeComponent: {
        name: string;
        description: string;
        position?: { // <-- ADD THIS
            top: string;
            left: string;
        };
    };
}

export const useHubStore = defineStore('hub', () => {
    // --- State ---
    const location = ref<HubState['location']>(null);
    const npcs = ref<HubState['npcs']>([]);
    const nodes = ref<HubState['nodes']>([]);
    const unsubscribe = ref<(() => void) | null>(null);

    // --- Getters ---
    const hubName = computed(() => location.value?.LocationComponent.name ?? 'Unknown Location');

    // --- Actions ---
    async function initialize() {
        await App.isReady;
        if (unsubscribe.value) unsubscribe.value();

        unsubscribe.value = App.queries.subscribe<HubState>('hubState', (newHubState) => {
            console.log('[DEBUG Frontend Store] Hub store received new state:', newHubState);

            if (newHubState) {
                location.value = newHubState.location;
                npcs.value = newHubState.npcs;
                nodes.value = newHubState.nodes || [];
            } else {
                location.value = null;
                npcs.value = [];
                nodes.value = [];
            }
        });
    }

    return {
        location,
        npcs,
        nodes,
        hubName,
        initialize,
    };
});