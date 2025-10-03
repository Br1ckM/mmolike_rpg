import { defineStore } from 'pinia';
import { ref } from 'vue';
import { App } from 'mmolike_rpg-application';
import { useHubStore } from './hub';

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
    async function initialize() {
        await App.isReady;
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
        const response = dialogue.value?.responses[index];

        if (!dialogue.value || !response) return;

        // Log player response before processing action
        dialogue.value.history.push({
            speaker: 'Player',
            text: response.text
        });

        if (response.action === 'EXIT_TO_SHOP') {
            exitDialogueAndOpenService('Shop');
        } else if (response.action === 'EXIT_TO_TRAINER') {
            exitDialogueAndOpenService('Trainer');
        } else if (response.action === 'END_DIALOGUE') { // <-- NEW HANDLER ADDED
            dialogue.value = null; // <-- CLEARS THE DIALOGUE STATE, CLOSING THE MODAL
        } else {
            // Default: Send command to the game engine to continue dialogue
            App.commands.selectDialogueResponse(index);
        }
    }

    function exitDialogueAndOpenService(service: 'Shop' | 'Trainer') {
        const hubStore = useHubStore();
        dialogue.value = null; // Clear dialogue state
        hubStore.setActiveService(service); // Set the service to open the panel
    }

    /** NEW ACTION: Simulates the game engine starting dialogue */
    function startDialogue(npcId: number, npcName: string) {
        // Clear any existing service panel
        useHubStore().clearActiveService();

        // Placeholder for complex NPC dialogue, now including image and history setup
        const npcImage = useHubStore().activeEntity?.imageUrl || 'https://placehold.co/150x150/1f2937/fff?text=NPC'; // Fetch image from hub store entity

        const initialText = "Welcome, adventurer. What service do you require from the " + npcName + "?";

        dialogue.value = {
            npcName: npcName,
            npcImage: npcImage, // <-- INCLUDED
            text: initialText,
            responses: [
                { text: "I wish to browse your goods.", action: 'EXIT_TO_SHOP' },
                { text: "I seek knowledge and training.", action: 'EXIT_TO_TRAINER' },
                { text: "I have a task for you (Quest).", action: 'NEXT_DIALOGUE' },
                { text: "Nevermind.", action: 'END_DIALOGUE' },
            ],
            history: [ // <-- INITIALIZED HISTORY
                { speaker: 'NPC', text: initialText }
            ]
        };
    }

    return {
        dialogue,
        combat,
        notifications,
        initialize,
        selectDialogueResponse,
        exitDialogueAndOpenService,
        startDialogue,
    };
});