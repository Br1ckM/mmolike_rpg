// apps/web/src/stores/party.ts

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { App } from 'mmolike_rpg-application/core';

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
        // Try PlayerService first (preferred), then legacy App.game, then queries.get('playerState')
        const playerSvc: any = App.playerService ?? (App.getService && App.getService('PlayerService'));

        const getPlayerState = async () => {
            if (playerSvc && typeof playerSvc.getPlayerState === 'function') return playerSvc.getPlayerState();
            if ((App as any).game && typeof (App as any).game.getPlayerState === 'function') return (App as any).game.getPlayerState();
            if (App.queries && typeof App.queries.get === 'function') return App.queries.get('playerState');
            return null;
        };

        getPlayerState().then((playerState: any) => {
            console.log('[PartyStore] Refreshing party state with:', playerState);

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
        });
    }

    // --- Actions ---
    async function initialize() {
        await App.isReady;
        if (unsubscribe.value) unsubscribe.value();

        // 1. Subscribe to future updates (prefer GameService)
        const gameSvc: any = App.getService && App.getService('GameService');
        if (gameSvc && typeof gameSvc.subscribe === 'function') {
            unsubscribe.value = gameSvc.subscribe('partyUpdated', () => refreshPartyState());
        } else {
            unsubscribe.value = App.queries.subscribe<any>('partyUpdated', () => refreshPartyState());
        }

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