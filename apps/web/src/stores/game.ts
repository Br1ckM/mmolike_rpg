import { defineStore } from 'pinia';
import { ref } from 'vue';
import { App } from 'mmolike_rpg-application';

interface HistoryEntry {
    speaker: 'NPC' | 'Player';
    text: string;
}
// Define types for the state slices we'll be subscribing to
interface DialogueState {
    npcName: string;
    npcImage: string;
    text: string;
    responses: any[];
    history: HistoryEntry[];
}

interface CombatState {
    combatEntityId: string;
    combatants: any[];
    turnQueue: string[];
    currentTurnIndex: number;
    roundNumber: number;
}

export const useGameStore = defineStore('game', () => {
    // --- State ---
    const dialogue = ref<DialogueState | null>(null);
    const combat = ref<CombatState | null>(null);
    const notifications = ref<{ message: string; type: string }[]>([]); // Ensure type matches component
    const notificationUnsubscribe = ref<(() => void) | null>(null); // Add unsubscribe ref

    const dialogueUnsubscribe = ref<(() => void) | null>(null);
    const combatUnsubscribe = ref<(() => void) | null>(null);
    const activeService = ref<'Shop' | 'Trainer' | null>(null);

    // --- Actions ---
    async function initialize() {
        await App.isReady;

        // Subscribe to dialogue state
        dialogueUnsubscribe.value = App.queries.subscribe<any>('dialogueState', (newDialogueData) => {
            if (newDialogueData) {
                // FIX: The backend now sends the complete object, so we just assign it.
                dialogue.value = {
                    npcName: newDialogueData.npcName,
                    npcImage: newDialogueData.npcAvatarUrl,
                    text: newDialogueData.text,
                    responses: newDialogueData.responses,
                    history: newDialogueData.history // <-- Use history from the backend
                };
                activeService.value = null;
            } else {
                dialogue.value = null;
            }
        });

        // Listen for domain events that open service screens
        App.queries.subscribe('vendorScreenOpened', () => {
            dialogue.value = null; // Close dialogue
            activeService.value = 'Shop';
        });

        App.queries.subscribe('trainingScreenOpened', () => {
            dialogue.value = null; // Close dialogue
            activeService.value = 'Trainer';
        });

        // Subscribe to the combat state
        combatUnsubscribe.value = App.queries.subscribe<CombatState>('combatState', (newCombatState) => {
            combat.value = newCombatState;
        });

        // Subscribe to notifications
        notificationUnsubscribe.value = App.queries.subscribe<{ message: string, type: string }>('notification', (notification) => {
            notifications.value.push(notification);
            // Optional: auto-remove notification after a few seconds
            if (notifications.value.length > 5) { // Keep the list from getting too long
                notifications.value.shift();
            }
        });
    }

    function selectDialogueResponse(index: number) {
        App.commands.selectDialogueResponse(index);
    }

    function clearActiveService() {
        activeService.value = null;
    }


    return {
        dialogue,
        combat,
        notifications,
        activeService,
        initialize,
        selectDialogueResponse,
        clearActiveService
    };
});
