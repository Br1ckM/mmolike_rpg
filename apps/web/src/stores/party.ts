// apps/web/src/stores/party.ts

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { App } from 'mmolike_rpg-application';

// Define the shape of a companion DTO
export interface UICompanion {
    id: number;
    name: string;
    avatarUrl: string;
    inActiveParty: boolean;
}

export const usePartyStore = defineStore('party', () => {
    // --- State ---
    const companions = ref<UICompanion[]>([]);
    const unsubscribe = ref<(() => void) | null>(null);

    // --- Getters ---
    const activeParty = computed(() => companions.value.filter(c => c.inActiveParty));
    const benchedCompanions = computed(() => companions.value.filter(c => !c.inActiveParty));

    // --- NEW: Extracted refresh logic ---
    function refreshPartyState() {
        const playerState = App.game.getPlayerState();
        console.log("[PartyStore] Refreshing party state with:", playerState);

        if (playerState && playerState.companions) {
            companions.value = playerState.companions.map((c: any) => ({
                id: c.id,
                name: c.InfoComponent.name,
                avatarUrl: c.InfoComponent.avatarUrl,
                inActiveParty: c.CompanionComponent.inActiveParty,
            }));
        } else {
            companions.value = [];
        }
    }

    // --- Actions ---
    async function initialize() {
        await App.isReady;
        if (unsubscribe.value) unsubscribe.value();

        // --- MODIFIED: Use the extracted function ---
        // 1. Subscribe to future updates
        unsubscribe.value = App.queries.subscribe<any>('partyUpdated', refreshPartyState);

        // 2. Immediately fetch the current state
        refreshPartyState();
    }

    return {
        companions,
        activeParty,
        benchedCompanions,
        initialize,
    };
});