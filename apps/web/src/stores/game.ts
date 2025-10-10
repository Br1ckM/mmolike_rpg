import { defineStore } from 'pinia';
import { ref } from 'vue';
import { App } from 'mmolike_rpg-application';

interface HistoryEntry {
    speaker: 'NPC' | 'Player';
    text: string;
}
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

interface CombatLogEvent {
    id: number;
    targetId: string;
    amount: number;
    type: 'damage' | 'heal' | 'crit';
}

interface CombatResult {
    winningTeamId: string;
}

// --- NEW TYPES ---
interface VendorItem {
    id: number;
    name: string;
    cost: number;
    icon: string;
}

interface TrainerSkill {
    id: string;
    name: string;
    cost: number;
    description: string;
}



export const useGameStore = defineStore('game', () => {
    const timeOfDay = ref<'Morning' | 'Afternoon' | 'Evening' | 'Night'>('Morning'); // <-- NEW STATE
    const dialogue = ref<DialogueState | null>(null);
    const combat = ref<CombatState | null>(null);
    const combatResult = ref<CombatResult | null>(null);
    const notifications = ref<{ message: string; type: string }[]>([]);
    const combatLog = ref<CombatLogEvent[]>([]);
    const notificationUnsubscribe = ref<(() => void) | null>(null);
    const dialogueUnsubscribe = ref<(() => void) | null>(null);
    const combatUnsubscribe = ref<(() => void) | null>(null);
    const combatResultUnsubscribe = ref<(() => void) | null>(null);
    const activeService = ref<'Shop' | 'Trainer' | null>(null);
    const playerLeveledUpUnsubscribe = ref<(() => void) | null>(null);
    const timeOfDayUnsubscribe = ref<(() => void) | null>(null);

    // --- NEW STATE ---
    const vendorItems = ref<VendorItem[]>([]);
    const trainerSkills = ref<TrainerSkill[]>([]);
    const vendorUnsubscribe = ref<(() => void) | null>(null);
    const denState = ref<{ denId: string; denName: string; currentStage: number; totalStages: number; status?: string } | null>(null);


    async function initialize() {
        await App.isReady;

        App.queries.subscribe<any>('denState', (newState) => {
            denState.value = newState;
        });

        App.queries.subscribe('combatEnded', () => {
            setTimeout(() => denState.value = null, 3000); // Clear after a delay
        });

        timeOfDayUnsubscribe.value = App.queries.subscribe<{ newTime: 'Morning' | 'Afternoon' | 'Evening' | 'Night' }>('timeOfDayChanged', (payload) => {
            if (payload) {
                timeOfDay.value = payload.newTime;
            }
        });

        dialogueUnsubscribe.value = App.queries.subscribe<any>('dialogueState', (newDialogueData) => {
            if (newDialogueData) {
                dialogue.value = {
                    npcName: newDialogueData.npcName,
                    npcImage: newDialogueData.npcAvatarUrl,
                    text: newDialogueData.text,
                    responses: newDialogueData.responses,
                    history: newDialogueData.history
                };
                activeService.value = null;
            } else {
                dialogue.value = null;
            }
        });

        App.queries.subscribe('vendorScreenOpened', () => {
            dialogue.value = null;
            activeService.value = 'Shop';
        });

        App.queries.subscribe('trainingScreenOpened', () => {
            dialogue.value = null;
            activeService.value = 'Trainer';
            // Placeholder data until TrainerSystem is fully implemented
            trainerSkills.value = [
                { id: 'skill_power_strike', name: 'Power Strike', cost: 100, description: 'A powerful overhead swing.' },
                { id: 'skill_fortify', name: 'Fortify', cost: 250, description: 'Temporarily increases defense.' },
            ];
        });

        // --- NEW SUBSCRIPTION ---
        vendorUnsubscribe.value = App.queries.subscribe<any>('vendorInventoryUpdated', (payload) => {
            vendorItems.value = payload.vendorItems;
        });

        combatUnsubscribe.value = App.queries.subscribe<CombatState>('combatState', (newCombatState) => {
            combat.value = newCombatState;
            if (newCombatState) {
                // Reset result when new combat starts
                combatResult.value = null;
            }
        });

        combatResultUnsubscribe.value = App.queries.subscribe<CombatResult>('combatResult', (result) => {
            combatResult.value = result;
        });

        playerLeveledUpUnsubscribe.value = App.queries.subscribe<{ newLevel: number }>('playerLeveledUp', ({ newLevel }) => {
            notifications.value.push({
                type: 'success',
                message: `Congratulations! You have reached Level ${newLevel}!`,
            });
        });

        notificationUnsubscribe.value = App.queries.subscribe<{ message: string, type: string }>('notification', (notification) => {
            notifications.value.push(notification);
            if (notifications.value.length > 5) {
                notifications.value.shift();
            }
        });

        App.queries.subscribe('damageDealt', (payload: { targetId: string; damage: number, isCritical: boolean }) => {
            const event: CombatLogEvent = {
                id: Date.now() + Math.random(),
                targetId: payload.targetId,
                amount: payload.damage,
                type: payload.isCritical ? 'crit' : 'damage',
            };
            combatLog.value.push(event);
            setTimeout(() => {
                combatLog.value = combatLog.value.filter(e => e.id !== event.id);
            }, 1500);
        });

        App.queries.subscribe('healthHealed', (payload: { targetId: string; amount: number }) => {
            const event: CombatLogEvent = {
                id: Date.now() + Math.random(),
                targetId: payload.targetId,
                amount: payload.amount,
                type: 'heal',
            };
            combatLog.value.push(event);
            setTimeout(() => {
                combatLog.value = combatLog.value.filter(e => e.id !== event.id);
            }, 1500);
        });
    }

    function selectDialogueResponse(index: number) {
        App.commands.selectDialogueResponse(index);
    }

    function clearActiveService() {
        activeService.value = null;
    }

    function clearCombatState() {
        combat.value = null;
        combatResult.value = null;
        combatLog.value = [];
    }

    function clearDenState() {
        denState.value = null;
    }

    return {
        timeOfDay,
        dialogue,
        combat,
        notifications,
        combatLog,
        activeService,
        combatResult,
        vendorItems, // <-- EXPORT
        trainerSkills, // <-- EXPORT
        initialize,
        selectDialogueResponse,
        clearActiveService,
        clearCombatState,
        denState,
        clearDenState,
    };
});