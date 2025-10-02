import { defineStore } from 'pinia';
import { ref } from 'vue';
import { App } from 'mmolike_rpg-application';

// Define types for the state slices we'll be subscribing to
interface DialogueState {
    npcName: string;
    text: string;
    responses: any[];
}

interface CombatState {
    combatEntityId: string;
    combatants: string[];
}

export const useGameStore = defineStore('game', () => {
    // --- State ---
    const dialogue = ref<DialogueState | null>(null);
    const combat = ref<CombatState | null>(null);
    const notifications = ref<{ message: string; type: 'info' | 'error' | 'success' }[]>([]);

    const dialogueUnsubscribe = ref<(() => void) | null>(null);
    const combatUnsubscribe = ref<(() => void) | null>(null);
    const notificationUnsubscribe = ref<(() => void) | null>(null);

    // --- Actions ---
    function initialize() {
        // Subscribe to the dialogue state
        dialogueUnsubscribe.value = App.queries.subscribe<DialogueState>('dialogueState', (newDialogueState) => {
            dialogue.value = newDialogueState;
        });

        // Subscribe to the combat state
        combatUnsubscribe.value = App.queries.subscribe<CombatState>('combatState', (newCombatState) => {
            combat.value = newCombatState;
        });

        // Subscribe to notifications
        notificationUnsubscribe.value = App.queries.subscribe<{ message: string, type: 'info' | 'error' | 'success' }>('notification', (notification) => {
            notifications.value.push(notification);
            // Optional: auto-remove notification after a few seconds
            setTimeout(() => notifications.value.shift(), 3000);
        });
    }

    function selectDialogueResponse(index: number) {
        App.commands.selectDialogueResponse(index);
    }

    return {
        dialogue,
        combat,
        notifications,
        initialize,
        selectDialogueResponse,
    };
});