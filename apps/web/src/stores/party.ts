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

    // --- Actions ---
    async function initialize() {
        await App.isReady;
        if (unsubscribe.value) unsubscribe.value();

        unsubscribe.value = App.queries.subscribe<any>('partyUpdated', () => {
            const playerState = App.game.getPlayerState();

            // --- FIX: Log the variable *after* it's defined ---
            console.log("[PartyStore] Heard 'partyUpdated' and fetched new playerState:", playerState);
            // --- END FIX ---

            if (playerState && playerState.companions) {
                companions.value = playerState.companions.map((c: any) => ({
                    id: c.id,
                    name: c.InfoComponent.name,
                    avatarUrl: c.InfoComponent.avatarUrl,
                    inActiveParty: c.CompanionComponent.inActiveParty,
                }));
            } else {
                // Handle case where there are no companions
                companions.value = [];
            }
        });
    }

    return {
        companions,
        activeParty,
        benchedCompanions,
        initialize,
    };
});